import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { withTransaction, logHistoryAction } from '../../db/postgres.js';
import { computePactStatTransfer } from '../../shared/statCalculator.js';

export const pactsFaithRoutes = new OpenAPIHono();

// Signer un pacte (Humain limité à 1 pacte ; Ange/Démon limité selon son rang, 3 de base, par recherche de pseudo)
pactsFaithRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/pact/sign',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              etherealId: z.string().uuid(),
              humanPseudo: z.string().min(3),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Pacte signé' }, 400: { description: 'Limite atteinte ou joueur introuvable' } },
  }),
  async (c) => {
    const { etherealId, humanPseudo } = c.req.valid('json');

    return withTransaction(async (client) => {
      const humanRes = await client.query(
        `SELECT * FROM game_schema.characters WHERE pseudo = $1 AND race = 'Humain'`,
        [humanPseudo]
      );
      if (!humanRes.rows[0]) {
        return c.json({ error: 'Aucun Humain trouvé avec ce pseudo.' }, 400);
      }
      const human = humanRes.rows[0];

      const humanPactCount = await client.query(
        'SELECT COUNT(*)::int AS cnt FROM game_schema.pacts WHERE human_id = $1',
        [human.id]
      );
      if (humanPactCount.rows[0].cnt >= 1) {
        return c.json({ error: 'Cet Humain possède déjà son pacte unique.' }, 400);
      }

      const etherealPactCount = await client.query(
        'SELECT COUNT(*)::int AS cnt FROM game_schema.pacts WHERE ethereal_id = $1',
        [etherealId]
      );
      if (etherealPactCount.rows[0].cnt >= 3) {
        return c.json({ error: 'Nombre maximal de pactes atteint pour votre rang.' }, 400);
      }

      await client.query(
        `INSERT INTO game_schema.pacts (human_id, ethereal_id, is_active) VALUES ($1, $2, false)`,
        [human.id, etherealId]
      );

      await logHistoryAction(client, etherealId, human.id, etherealId, human.pseudo, 'Signature d’un Pacte de Sang');
      return c.json({ signedWith: human.pseudo }, 200);
    });
  }
);

// Activation du bonus par l'Humain (augmente ses stats et réduit de moitié moins celles de l'Ange/Démon)
pactsFaithRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/pact/activate-human-bonus',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              humanId: z.string().uuid(),
              etherealId: z.string().uuid(),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Bonus de pacte activé' } },
  }),
  async (c) => {
    const { humanId, etherealId } = c.req.valid('json');
    return withTransaction(async (client) => {
      const ethRes = await client.query('SELECT * FROM game_schema.characters WHERE id = $1', [etherealId]);
      const eth = ethRes.rows[0];
      const transfer = computePactStatTransfer(eth?.strength ?? 20, eth?.agility ?? 20);

      await client.query(
        `UPDATE game_schema.pacts
         SET is_active = true, activated_at = NOW(), expires_at = NOW() + INTERVAL '6 hours'
         WHERE human_id = $1 AND ethereal_id = $2`,
        [humanId, etherealId]
      );

      return c.json({ active: true, transfer });
    });
  }
);

// Requête de bénédiction par un fidèle (1 fois toutes les 72h) et exaucement par le Dieu contre de l'Énergie Divine
pactsFaithRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/faith/blessing',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              mode: z.enum(['REQUEST_72H', 'GOD_GRANT']),
              godId: z.string().uuid(),
              believerId: z.string().uuid(),
              blessingType: z.enum(['strength', 'agility', 'hp_max', 'heal']),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Requête ou bénédiction divine traitée' }, 400: { description: 'Délai 72h ou énergie divine insuffisante' } },
  }),
  async (c) => {
    const { mode, godId, believerId, blessingType } = c.req.valid('json');

    return withTransaction(async (client) => {
      if (mode === 'REQUEST_72H') {
        const faithRes = await client.query(
          'SELECT * FROM game_schema.faiths WHERE god_id = $1 AND believer_id = $2',
          [godId, believerId]
        );
        if (faithRes.rows[0]?.last_blessing_at) {
          const elapsedHours = (Date.now() - new Date(faithRes.rows[0].last_blessing_at).getTime()) / 3600000;
          if (elapsedHours < 72) {
            return c.json({ error: `Vous devez attendre 72h entre deux prières (${Math.ceil(72 - elapsedHours)}h restantes).` }, 400);
          }
        }
        await client.query(
          `UPDATE game_schema.faiths SET pending_blessing_type = $1 WHERE god_id = $2 AND believer_id = $3`,
          [blessingType, godId, believerId]
        );
        return c.json({ requested: true, blessingType }, 200);
      }

      // Réponse favorable du Dieu : consomme de l'Énergie Divine
      const divineCost = 15;
      const godRes = await client.query('SELECT * FROM game_schema.characters WHERE id = $1 FOR UPDATE', [godId]);
      if (!godRes.rows[0] || godRes.rows[0].divine_energy_current < divineCost) {
        return c.json({ error: 'Énergie divine insuffisante.' }, 400);
      }

      await client.query(
        'UPDATE game_schema.characters SET divine_energy_current = divine_energy_current - $1 WHERE id = $2',
        [divineCost, godId]
      );

      if (blessingType === 'heal') {
        await client.query(
          'UPDATE game_schema.characters SET hp_current = LEAST(hp_max, hp_current + 150) WHERE id = $1',
          [believerId]
        );
      } else {
        await client.query(
          `UPDATE game_schema.characters SET ${blessingType} = ${blessingType} + 5 WHERE id = $1`,
          [believerId]
        );
      }

      await client.query(
        `UPDATE game_schema.faiths
         SET last_blessing_at = NOW(), pending_blessing_type = NULL
         WHERE god_id = $1 AND believer_id = $2`,
        [godId, believerId]
      );

      return c.json({ granted: true, divineEnergySpent: divineCost }, 200);
    });
  }
);