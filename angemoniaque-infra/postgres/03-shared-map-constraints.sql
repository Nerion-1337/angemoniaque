CREATE TABLE IF NOT EXISTS game_schema.map_tiles (
  map_id UUID NOT NULL REFERENCES game_schema.maps(id) ON DELETE CASCADE,
  coord_x INT NOT NULL,
  coord_y INT NOT NULL,
  terrain_type VARCHAR(50) NOT NULL,
  move_cost INT NOT NULL DEFAULT 1,
  resource_type VARCHAR(50) NULL,
  PRIMARY KEY (map_id, coord_x, coord_y)
);

CREATE INDEX IF NOT EXISTS idx_positions_map_coords
  ON game_schema.positions (map_id, coord_x, coord_y);

CREATE UNIQUE INDEX IF NOT EXISTS uq_positions_active_actor_cell
  ON game_schema.positions (map_id, coord_x, coord_y)
  WHERE (character_id IS NOT NULL OR monsters_id IS NOT NULL) AND effect_active = true;

-- Génération automatique des cases communes (25x25) pour chacune des 3 cartes dans map_tiles
DO $$
DECLARE
  m RECORD;
  x INT;
  y INT;
  dist FLOAT;
  t_type VARCHAR(50);
  m_cost INT;
  r_type VARCHAR(50);
BEGIN
  FOR m IN SELECT id, name_file, width, height FROM game_schema.maps LOOP
    FOR x IN 0..(m.width - 1) LOOP
      FOR y IN 0..(m.height - 1) LOOP
        dist := SQRT(POWER(x - 12, 2) + POWER(y - 12, 2));
        IF dist > 11.8 THEN
          t_type := 'Mer / Abysses'; m_cost := 6; r_type := 'Perle Abyssale';
        ELSIF SQRT(POWER(x - 7, 2) + POWER(y - 8, 2)) < 2.6 OR (x = 8 AND y BETWEEN 8 AND 14) THEN
          t_type := 'Lac & Rivière d’Argent'; m_cost := 3; r_type := 'Eau Pure';
        ELSIF (x = 12 AND y BETWEEN 6 AND 18) OR (y = 12 AND x BETWEEN 6 AND 18) THEN
          t_type := 'Route Pavée'; m_cost := 1; r_type := NULL;
        ELSIF SQRT(POWER(x - 17, 2) + POWER(y - 6, 2)) < 3.4 OR SQRT(POWER(x - 18, 2) + POWER(y - 17, 2)) < 3.2 THEN
          t_type := 'Massif Rocheux Escarpé'; m_cost := 4; r_type := 'Or Pur';
        ELSIF SQRT(POWER(x - 6, 2) + POWER(y - 15, 2)) < 4.2 OR SQRT(POWER(x - 15, 2) + POWER(y - 15, 2)) < 2.8 THEN
          t_type := 'Forêt Ancienne'; m_cost := 2; r_type := 'Bois Runique';
        ELSE
          t_type := 'Plaine Verdoyante'; m_cost := 1; r_type := 'Herbes Mystiques';
        END IF;

        INSERT INTO game_schema.map_tiles (map_id, coord_x, coord_y, terrain_type, move_cost, resource_type)
        VALUES (m.id, x, y, t_type, m_cost, r_type)
        ON CONFLICT (map_id, coord_x, coord_y) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;