import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { query, withTransaction, logHistoryAction } from '../../db/postgres.js';
import { computeStatUpgradeXpCost, StatCostRuleRow } from '../../shared/statCalculator.js';

export const charactersRoutes = new OpenAPIHono();

const CreateCharacterSchema = z.object({
  accountId: z.string().uuid(),
  pseudo: z.string().min(3).max(40),
  race: z.enum(['Humain', 'Ange', 'Demon']),
  avatarUrl: z.string().url().optional(),
});

charactersRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    request: { body: { content: { 'application/json': { schema: CreateCharacterSchema } } } },
    responses: {
      201: { description: 'Personnage créé avec succès' },
      400: { description: 'Violation de la limite de 3 personnages ou de l’unicité de race' },
    },
  }),
  async (c) => {
    const { accountId, pseudo, race, avatarUrl } = c.req.valid('json');

    return withTransaction(async (client) => {
      const existing = await client.query<{ race: string }>(
        'SELECT race FROM game_schema.characters WHERE account_id = $1',
        [accountId]
      );
      if (existing.rows.length >= 3) {
        return c.json({ error: 'Un joueur est limité à 3 personnages maximum.' }, 400);
      }
      if (existing.rows.length > 0 && existing.rows[0].race !== race) {
        return c.json({ error: `Vos personnages doivent tous être de la race ${existing.rows[0].race}.` }, 400);
      }

      const defaultRank = race === 'Humain' ? 'Mortel' : 'Soldat';
      const specRes = await client.query(
        'SELECT * FROM game_schema.specializations WHERE race = $1 AND rank = $2',
        [race, defaultRank]
      );
      const spec = specRes.rows[0];

      const inserted = await client.query(
        `INSERT INTO game_schema.characters (
          account_id, pseudo, race, rank, avatar_url,
          hp_current, hp_max, energy_current, energy_max,
          divine_energy_current, divine_energy_max, strength, agility, recovery, see, gold, xp
        ) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$7,$8,$8,$9,$10,$11,$12,150,0)
        RETURNING *`,
        [
          accountId, pseudo, race, defaultRank, avatarUrl ?? null,
          spec.hp_max, spec.energy_max, spec.divine_energy_max,
          spec.strength, spec.agility, spec.recovery, spec.see,
        ]
      );

      return c.json({ character: inserted.rows[0] }, 201);
    });
  }
);

// Amélioration d'une caractéristique selon stat_cost_rules
charactersRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/:id/upgrade-stat',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              statName: z.enum(['hp_max', 'recovery', 'see', 'strength', 'agility', 'energy_max', 'divine_energy_max']),
              upgradesAlreadyDone: z.number().int().min(0),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Statistique améliorée' }, 400: { description: 'XP insuffisante' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const { statName, upgradesAlreadyDone } = c.req.valid('json');

    return withTransaction(async (client) => {
      const ruleRes = await client.query<StatCostRuleRow>(
        'SELECT * FROM game_schema.stat_cost_rules WHERE stat_name = $1',
        [statName]
      );
      const charRes = await client.query('SELECT * FROM game_schema.characters WHERE id = $1 FOR UPDATE', [id]);
      if (!ruleRes.rows[0] || !charRes.rows[0]) {
        return c.json({ error: 'Introuvable' }, 400);
      }

      const cost = computeStatUpgradeXpCost(ruleRes.rows[0], upgradesAlreadyDone);
      const char = charRes.rows[0];
      if (char.xp < cost) {
        return c.json({ error: `XP insuffisante (${cost} XP requis)` }, 400);
      }

      const bonusValue = statName === 'hp_max' ? 10 : statName === 'energy_max' || statName === 'divine_energy_max' ? 5 : 1;
      const updated = await client.query(
        `UPDATE game_schema.characters
         SET xp = xp - $1, ${statName} = ${statName} + $2
         WHERE id = $3 RETURNING *`,
        [cost, bonusValue, id]
      );

      await logHistoryAction(client, id, id, char.pseudo, char.pseudo, `Amélioration ${statName} (+${bonusValue}) pour ${cost} XP`);
      return c.json({ character: updated.rows[0], costPaid: cost }, 200);
    });
  }
);