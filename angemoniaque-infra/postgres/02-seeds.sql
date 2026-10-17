INSERT INTO game_schema.stat_cost_rules (stat_name, base_xp_cost, numb_up, multi_1, multi_2, multi_3) VALUES
  ('hp_max',             2, 50, 1.0, 2.0, 3.0),
  ('recovery',          25, 10, 1.0, 2.0, 3.0),
  ('see',               25, 10, 1.0, 2.0, 3.0),
  ('strength',          50, 10, 1.0, 2.0, 3.0),
  ('agility',           50, 10, 1.0, 2.0, 3.0),
  ('energy_max',        10, 20, 1.0, 2.0, 3.0),
  ('divine_energy_max', 20, 20, 1.0, 2.0, 3.0)
ON CONFLICT (stat_name) DO NOTHING;

INSERT INTO game_schema.specializations (
  race, rank, gain_xp_hour, max_population_percent, max_rank, current_rank,
  hp_max, recovery, see, strength, agility, energy_max, divine_energy_max
) VALUES
  ('Humain', 'Mortel',    2, 100, 5, 1, 100,  5,  5,  5,  5,  50,  0),
  ('Humain', 'Héros',     1,  50, 5, 2, 200,  8,  8, 10, 10,  65,  0),
  ('Humain', 'Immortel',  2,  25, 5, 3, 350, 10, 10, 14, 14,  80,  0),
  ('Humain', 'Demi-Dieu', 3,  10, 5, 4, 500, 12, 12, 20, 20, 100, 20),
  ('Humain', 'Divin',     2, 0.1, 5, 5, 1000, 20, 20, 40, 40, 200, 50),
  ('Demon',  'Soldat',    3, 100, 5, 2, 200,  8,  8, 10, 10,  65,  0),
  ('Demon',  'Duc',       2,  50, 5, 3, 350, 10, 10, 14, 14,  80,  0),
  ('Demon',  'Titan',     3,  25, 5, 4, 500, 12, 12, 20, 20, 100, 20),
  ('Demon',  'Divin',     2, 0.1, 5, 5, 1000, 20, 20, 40, 40, 200, 50),
  ('Ange',   'Soldat',    3, 100, 5, 2, 200,  8,  8, 10, 10,  65,  0),
  ('Ange',   'Archange',  2,  50, 5, 3, 350, 10, 10, 14, 14,  80,  0),
  ('Ange',   'Seraphin',  3,  25, 5, 4, 500, 12, 12, 20, 20, 100, 20),
  ('Ange',   'Divin',     2, 0.1, 5, 5, 1000, 20, 20, 40, 40, 200, 50),
  ('Nephilime', 'Soldat',   3, 10, 5, 3, 400, 12, 12, 15, 15,  90, 10),
  ('Nephilime', 'Immortel', 3,  5, 5, 4, 800, 15, 15, 30, 30, 150, 35)
ON CONFLICT (race, rank) DO NOTHING;

INSERT INTO game_schema.monsters (
  name, hp_max, recovery, see, strength, agility, energy_max, divine_energy_max,
  hp_current, energy_current, divine_energy_current, range, armor, gain_xp_hour, gold_current
) VALUES
  ('Léviathan', 3000, 50, 15, 50, 20, 200, 0, 3000, 200, 0, 5, 50, 0, 1000),
  ('Balrog',    3000, 50, 15, 50, 20, 200, 0, 3000, 200, 0, 5, 50, 0, 1000),
  ('Minotaure', 1500, 25, 10, 25, 10, 100, 0, 1500, 100, 0, 5, 25, 0, 450)
ON CONFLICT (name) DO NOTHING;

INSERT INTO game_schema.items (name, type, quantity_max) VALUES
  ('Relique',  'Divin', 4),
  ('Arcane',   'Divin', 4),
  ('Artefact', 'Divin', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO game_schema.buildings (blocks_cell, name, type, is_invulnerable) VALUES
  (true, 'Hôtel de ville',              'Structure', true),
  (true, 'Bastion Infernal',            'Structure', true),
  (true, 'Sanctuaire de la Providence', 'Structure', true),
  (true, 'Le Seuil des Deux Voiles',    'Structure', true),
  (true, 'Brèche de Soufre',            'Structure', true),
  (true, 'L’Arche de Grâce',            'Structure', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO game_schema.maps (name_file, width, height) VALUES
  ('monde_des_hommes', 25, 25),
  ('plan_ethere',      25, 25),
  ('les_limbes',       25, 25)
ON CONFLICT (name_file) DO NOTHING;

INSERT INTO game_schema.mounts (name, hp_max, energy_max, armor, bonus_range, bonus_see, special_attack_name, special_attack_damage) VALUES
  ('Dragon de Rubis Ancien',    450, 120, 20, 2, 2, 'Cracher du feu', 65),
  ('Destrier Céleste Cuirassé', 220,  90, 12, 1, 1, NULL, 0)
ON CONFLICT (name) DO NOTHING;