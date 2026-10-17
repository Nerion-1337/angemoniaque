CREATE SCHEMA IF NOT EXISTS game_schema;

CREATE TABLE IF NOT EXISTS game_schema.stat_cost_rules (
  stat_name VARCHAR(50) PRIMARY KEY,
  base_xp_cost INT NOT NULL,
  numb_up INT NOT NULL,
  multi_1 REAL NOT NULL,
  multi_2 REAL NOT NULL,
  multi_3 REAL NOT NULL,
  CONSTRAINT uq_stat_cost_rules_stat_name UNIQUE (stat_name)
);

CREATE TABLE IF NOT EXISTS game_schema.specializations (
  id SERIAL PRIMARY KEY,
  race VARCHAR(30) NOT NULL,
  rank VARCHAR(30) NOT NULL,
  gain_xp_hour INT NOT NULL,
  max_population_percent REAL NOT NULL,
  max_rank INT NOT NULL,
  current_rank INT NOT NULL,
  hp_max INT NOT NULL,
  recovery INT NOT NULL,
  see INT NOT NULL,
  strength INT NOT NULL,
  agility INT NOT NULL,
  energy_max INT NOT NULL,
  divine_energy_max INT NOT NULL,
  CONSTRAINT uq_specializations_race_rank UNIQUE (race, rank)
);

CREATE TABLE IF NOT EXISTS game_schema.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  pseudo VARCHAR(50) UNIQUE NOT NULL,
  race VARCHAR(30) NOT NULL,
  rank VARCHAR(30) NOT NULL,
  avatar_url TEXT,
  hp_current INT NOT NULL DEFAULT 100,
  hp_max INT NOT NULL DEFAULT 100,
  energy_current INT NOT NULL DEFAULT 50,
  energy_max INT NOT NULL DEFAULT 50,
  divine_energy_current INT NOT NULL DEFAULT 0,
  divine_energy_max INT NOT NULL DEFAULT 0,
  strength INT NOT NULL DEFAULT 5,
  agility INT NOT NULL DEFAULT 5,
  recovery INT NOT NULL DEFAULT 5,
  see INT NOT NULL DEFAULT 5,
  gold REAL NOT NULL DEFAULT 100,
  xp INT NOT NULL DEFAULT 0,
  chest_capacity INT NOT NULL DEFAULT 10,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_schema.monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  hp_max INT NOT NULL,
  hp_current INT NOT NULL,
  recovery INT NOT NULL,
  see INT NOT NULL,
  strength INT NOT NULL,
  agility INT NOT NULL,
  energy_max INT NOT NULL,
  energy_current INT NOT NULL,
  divine_energy_max INT NOT NULL DEFAULT 0,
  divine_energy_current INT NOT NULL DEFAULT 0,
  range INT NOT NULL DEFAULT 1,
  armor INT NOT NULL DEFAULT 0,
  gain_xp_hour INT NOT NULL DEFAULT 0,
  gold_current REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_schema.character_monster (
  character_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  monster_id UUID NOT NULL REFERENCES game_schema.monsters(id) ON DELETE CASCADE,
  PRIMARY KEY (character_id, monster_id)
);

CREATE TABLE IF NOT EXISTS game_schema.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  quantity_max INT,
  armor INT NOT NULL DEFAULT 0,
  strength_bonus INT NOT NULL DEFAULT 0,
  agility_bonus INT NOT NULL DEFAULT 0,
  head BOOLEAN NOT NULL DEFAULT false,
  chest BOOLEAN NOT NULL DEFAULT false,
  right_hand BOOLEAN NOT NULL DEFAULT false,
  left_hand BOOLEAN NOT NULL DEFAULT false,
  two_hands BOOLEAN NOT NULL DEFAULT false,
  foot BOOLEAN NOT NULL DEFAULT false,
  amulet BOOLEAN NOT NULL DEFAULT false,
  ring BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT uq_items_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS game_schema.spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  monster_id UUID NULL REFERENCES game_schema.monsters(id) ON DELETE SET NULL,
  energy_cost INT NOT NULL DEFAULT 10,
  damage INT NOT NULL DEFAULT 0,
  duration_turns_h INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_schema.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  hp_max INT NOT NULL DEFAULT 1000,
  armor INT NOT NULL DEFAULT 50,
  blocks_cell BOOLEAN NOT NULL DEFAULT true,
  is_invulnerable BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT uq_buildings_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS game_schema.mounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  hp_max INT NOT NULL,
  energy_max INT NOT NULL DEFAULT 100,
  armor INT NOT NULL DEFAULT 0,
  bonus_range INT NOT NULL DEFAULT 0,
  bonus_see INT NOT NULL DEFAULT 0,
  special_attack_name VARCHAR(100),
  special_attack_damage INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_schema.specialization_inventory (
  item_id UUID NOT NULL REFERENCES game_schema.items(id) ON DELETE CASCADE,
  specialization_id INT NOT NULL REFERENCES game_schema.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS game_schema.character_inventory (
  character_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES game_schema.items(id) ON DELETE CASCADE,
  monster_id UUID NULL REFERENCES game_schema.monsters(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  xp_current INT NOT NULL DEFAULT 0,
  effect_active BOOLEAN NOT NULL DEFAULT false,
  equipped_slot VARCHAR(40) NULL,
  duration_turns_h INT NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, item_id)
);

CREATE TABLE IF NOT EXISTS game_schema.specialization_spell (
  spell_id UUID NOT NULL REFERENCES game_schema.spells(id) ON DELETE CASCADE,
  specialization_id INT NOT NULL REFERENCES game_schema.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (spell_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS game_schema.character_spells (
  character_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  spell_id UUID NOT NULL REFERENCES game_schema.spells(id) ON DELETE CASCADE,
  xp_current INT NOT NULL DEFAULT 0,
  effect_active BOOLEAN NOT NULL DEFAULT false,
  duration_turns_h INT NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, spell_id)
);

CREATE TABLE IF NOT EXISTS game_schema.specialization_buildings (
  building_id UUID NOT NULL REFERENCES game_schema.buildings(id) ON DELETE CASCADE,
  specialization_id INT NOT NULL REFERENCES game_schema.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (building_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS game_schema.character_buildings (
  character_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES game_schema.buildings(id) ON DELETE CASCADE,
  hp_current INT NOT NULL,
  xp_current INT NOT NULL DEFAULT 0,
  effect_active BOOLEAN NOT NULL DEFAULT true,
  duration_turns_h INT NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, building_id)
);

CREATE TABLE IF NOT EXISTS game_schema.specialization_mounts (
  mounts_id UUID NOT NULL REFERENCES game_schema.mounts(id) ON DELETE CASCADE,
  specialization_id INT NOT NULL REFERENCES game_schema.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (mounts_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS game_schema.character_mounts (
  character_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  mounts_id UUID NOT NULL REFERENCES game_schema.mounts(id) ON DELETE CASCADE,
  hp_current INT NOT NULL,
  xp_current INT NOT NULL DEFAULT 0,
  energy_current INT NOT NULL,
  effect_active BOOLEAN NOT NULL DEFAULT false,
  duration_turns_h INT NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, mounts_id)
);

CREATE TABLE IF NOT EXISTS game_schema.maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_file VARCHAR(100) UNIQUE NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_schema.positions (
  id BIGSERIAL PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES game_schema.maps(id) ON DELETE CASCADE,
  coord_x INT NOT NULL,
  coord_y INT NOT NULL,
  character_id UUID NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  monsters_id UUID NULL REFERENCES game_schema.monsters(id) ON DELETE CASCADE,
  building_id UUID NULL REFERENCES game_schema.buildings(id) ON DELETE CASCADE,
  mount_id UUID NULL REFERENCES game_schema.mounts(id) ON DELETE CASCADE,
  item_id UUID NULL REFERENCES game_schema.items(id) ON DELETE CASCADE,
  effect_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT chk_exclusive_entity CHECK (
    (CASE WHEN character_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN monsters_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN building_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN mount_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN item_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
  )
);

CREATE TABLE IF NOT EXISTS game_schema.pacts (
  human_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  ethereal_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  activated_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (human_id, ethereal_id)
);

CREATE TABLE IF NOT EXISTS game_schema.faiths (
  god_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  believer_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_blessing_at TIMESTAMP NULL,
  pending_blessing_type VARCHAR(40) NULL,
  PRIMARY KEY (god_id, believer_id)
);

CREATE TABLE IF NOT EXISTS game_schema.history_action (
  id_log BIGSERIAL PRIMARY KEY,
  id_source UUID NULL REFERENCES game_schema.characters(id) ON DELETE SET NULL,
  id_cible UUID NULL REFERENCES game_schema.characters(id) ON DELETE SET NULL,
  id_object UUID NULL,
  source VARCHAR(100) NOT NULL,
  cible VARCHAR(100) NOT NULL,
  action VARCHAR(500) NOT NULL,
  effect_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_schema.messages (
  id BIGSERIAL PRIMARY KEY,
  id_conversation UUID NOT NULL,
  characters_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_schema.conversation_participants (
  id_conversation UUID NOT NULL,
  characters_id UUID NOT NULL REFERENCES game_schema.characters(id) ON DELETE CASCADE,
  last_read_message_id BIGINT NULL,
  PRIMARY KEY (id_conversation, characters_id)
);

CREATE TABLE IF NOT EXISTS game_schema.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  tag VARCHAR(10) UNIQUE NOT NULL,
  treasury_gold REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_schema.guild_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES game_schema.guilds(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS game_schema.guild_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES game_schema.guild_folders(id) ON DELETE CASCADE,
  author_pseudo VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE game_schema.mounts
  ADD COLUMN IF NOT EXISTS recovery_hp INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS recovery_energy INT NOT NULL DEFAULT 15;

ALTER TABLE game_schema.items
  ADD COLUMN IF NOT EXISTS req_strength INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weapon_damage INT NOT NULL DEFAULT 0;