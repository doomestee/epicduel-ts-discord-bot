--  Blacklist

CREATE TABLE blacklist (
    "o_id"   INT          PRIMARY KEY,
    "id"     BIGINT       NOT NULL,
    "type"   SMALLINT  NOT NULL,
    "source" BIGINT       NOT NULL,
    "start"  TIMESTAMP    NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "end"    TIMESTAMP    NULL      DEFAULT NULL
); -- AUTO_INCREMENT = 67

CREATE INDEX ON blacklist (id);

-- Character

CREATE TABLE character (
    id          INT          NOT NULL,
    user_id     INT          NOT NULL,
    name        VARCHAR(255) NOT NULL,
    flags       INT          NOT NULL DEFAULT 0,
    rating      INT          NOT NULL DEFAULT 0,
    exp         INT          NOT NULL DEFAULT 0,
    fame        INT          NOT NULL DEFAULT 0,
    faction_id  INT          NOT NULL DEFAULT 0,                 --REFERENCES faction (id) ON DELETE SET NULL,
    inv_slots   INT          NOT NULL,
    bank_slots  INT          NOT NULL,
    last_seen   TIMESTAMP    NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    -- This was added after we have like 13k characters, so it's gonna be nullable.
    alignment   INT          NULL DEFAULT NULL,

    -- Due to EpicDuel's awful security, user_id is actually the only thing that a user cannot spoof, but we need the character id so both will be included.
    PRIMARY KEY (id, user_id)
);-- ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX ON character lower(name);

-- Character Name

CREATE TABLE character_name (
    o_id        BIGSERIAL    PRIMARY KEY,
    id          INT          NOT NULL,
    name        VARCHAR(255) NOT NULL,
    first_seen  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);-- ENGINE=InnoDB AUTO_INCREMENT=15905 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX ON character_name (last_seen);
CREATE INDEX ON character_name (id);

-- Character Link

CREATE TABLE characterlink (
    discord_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    id INT NOT NULL,
    flags INT NOT NULL DEFAULT 0,
    last_famed TIMESTAMP NULL DEFAULT NULL,
    link_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id, user_id)
); -- ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX ON characterlink (discord_id);

-- Entity Skill

CREATE TABLE entity_skill (
    id INT NOT NULL,
    -- Type of entity, for eg NPC, BOSS or CHARACTER.
    type INT NOT NULL,
    skills TEXT NOT NULL,
    last_fetched TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id, type)
);

-- Entity Stat

CREATE TABLE entity_stat (
    id INT NOT NULL,
    type INT NOT NULL,

    hp INT NOT NULL,
    mp INT NOT NULL,

    gunid    INT DEFAULT NULL,
    gundmg   INT DEFAULT NULL,
    gunstr   INT DEFAULT NULL,
    gundex   INT DEFAULT NULL,
    guntech  INT DEFAULT NULL,
    gunsupp  INT DEFAULT NULL,

    auxid    INT DEFAULT NULL,
    auxdmg   INT DEFAULT NULL,
    auxstr   INT DEFAULT NULL,
    auxdex   INT DEFAULT NULL,
    auxtech  INT DEFAULT NULL,
    auxsupp  INT DEFAULT NULL,

    wpnid    INT DEFAULT NULL,
    wpndmg   INT DEFAULT NULL,
    wpnstr   INT DEFAULT NULL,
    wpndex   INT DEFAULT NULL,
    wpntech  INT DEFAULT NULL,
    wpnsupp  INT DEFAULT NULL,

    armorid    INT NOT NULL,
    armordef   INT DEFAULT NULL,
    armorres   INT DEFAULT NULL,
    armorstr   INT DEFAULT NULL,
    armordex   INT DEFAULT NULL,
    armortech  INT DEFAULT NULL,
    armorsupp  INT DEFAULT NULL,

    botid      INT DEFAULT NULL,

    legendary  TEXT NOT NULL,

    last_fetched  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    str  INT NOT NULL DEFAULT 0,
    dex  INT NOT NULL DEFAULT 0,
    tech INT NOT NULL DEFAULT 0,
    supp INT NOT NULL DEFAULT 0,

    classid  SMALLINT NOT NULL,

    -- Lvl or exp was added quite late, so there remain some entities that still have null for lvl/exp.
    lvl  SMALLINT NULL,
    exp  INT NULL,

    PRIMARY KEY (id, type)
);

-- Entity Style

CREATE TABLE entity_style (
    id   INT NOT NULL,
    type INT NOT NULL,

    charpri     VARCHAR(6)   NOT NULL,
    charsec     VARCHAR(6)   NOT NULL,
    charhair    VARCHAR(6)   NOT NULL,
    charhairS   INT          NOT NULL DEFAULT 0,
    characcnt   VARCHAR(6)   NOT NULL,
    characcnt2  VARCHAR(6)   NOT NULL,
    charskin    VARCHAR(6)   NOT NULL,
    chareye     VARCHAR(6)   NOT NULL,
    chargender  VARCHAR(1)   NOT NULL,
    charname    VARCHAR(255) NOT NULL,

    npcscale  FLOAT(2) NULL DEFAULT NULL,
    npchead   TEXT     NULL DEFAULT NULL,

    last_fetched TIMESTAMP NOT NULL,

    PRIMARY KEY (id, type)
);

-- Faction

CREATE TABLE faction (
    id        INT          PRIMARY KEY,
    name      VARCHAR(200) NOT NULL,
    alignment INT          NULL DEFAULT NULL
);

CREATE INDEX ON faction (name);

-- Fame

CREATE TABLE fame (
    char_id      INT          PRIMARY KEY,
    count        INT          NOT NULL,
    last_spoken  TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
    char_name    VARCHAR(255) NULL DEFAULT NULL
);

-- Merchant

CREATE TABLE merchant (
    id    INT  PRIMARY KEY,
    name  TEXT NOT NULL,

    items        JSONB     NOT NULL,
    last_fetched TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification

CREATE TABLE notification (
    id    SERIAL PRIMARY KEY,

    type  INT NOT NULL,

    guild_id    VARCHAR(25) NOT NULL,
    channel_id  VARCHAR(25) NOT NULL,
    thread_id   VARCHAR(25) NULL,
    creator_id  VARCHAR(25) NULL,

    message VARCHAR(500) DEFAULT NULL
); -- ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX ON notification (type);

-- Rallies

CREATE TABLE rallies (
    id SERIAL PRIMARY KEY,
    alignment INT NOT NULL,

    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    war_id INT DEFAULT NULL
); -- jesus 325, most of which were messed up ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX ON rallies (war_id);
CREATE INDEX ON rallies (triggered_at);

-- User Record

CREATE TABLE user_record (
    char_id INT PRIMARY KEY,

    w1  INT NOT NULL,
    w2  INT NOT NULL,
    wj  INT NOT NULL,
    l1  INT NOT NULL,
    l2  INT NOT NULL,
    lj  INT NOT NULL,
    npc INT NOT NULL,

    last_fetched TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Settings

CREATE TABLE user_settings (
    id VARCHAR(30) PRIMARY KEY,
    flags INT DEFAULT NULL,

    lb_view INT DEFAULT NULL,
    lb_default INT DEFAULT NULL
);

-- War

CREATE TABLE war (
    id  SERIAL  PRIMARY KEY,
    region_id   INT NOT NULL,
    max_points  INT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at   TIMESTAMP NULL DEFAULT NULL
); -- ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Gift

CREATE TABLE gifts (
    id SERIAL PRIMARY KEY,

    char_name VARCHAR(255) NOT NULL,
    char_id INT NULL,
    count_room INT NOT NULL,
    count_total INT NOT NULL,
    count_combo INT NOT NULL,
    fire_tier SMALLINT NOT NULL,
    global BOOLEAN NOT NULL,
    time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON gifts(char_name);
CREATE INDEX ON gifts(char_id);