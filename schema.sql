-- ============================================================
-- ROADTOUNINA — schema.sql
-- Database: PostgreSQL
-- Fonte di verità unica dello schema: Hibernate viene configurato
-- in modalità `validate`, NON `update`/`create`. Se le entity JPA
-- non combaciano con questo schema, l'app deve fallire all'avvio.
-- ============================================================

-- ------------------------------------------------------------
-- 1. USERS — utenti registrati
-- ------------------------------------------------------------
CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT chk_users_username_len CHECK (char_length(username) >= 3)
);

-- ------------------------------------------------------------
-- 2. GAMES — partite avviate dagli utenti registrati
-- ------------------------------------------------------------
CREATE TABLE games (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            BIGINT       NOT NULL,
    start_page_title   VARCHAR(255) NOT NULL,
    target_page_title  VARCHAR(255) NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    started_at         TIMESTAMP    NOT NULL DEFAULT now(),
    ended_at           TIMESTAMP,
    num_steps          INT          NOT NULL DEFAULT 0,
    active_seconds     BIGINT       NOT NULL DEFAULT 0,
    last_resumed_at    TIMESTAMP,

    CONSTRAINT fk_games_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_games_status
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),

    CONSTRAINT chk_games_num_steps_non_negative
        CHECK (num_steps >= 0),

    CONSTRAINT chk_games_active_seconds_non_negative
        CHECK (active_seconds >= 0),

    CONSTRAINT chk_games_ended_at_consistency
        CHECK (
            (status = 'IN_PROGRESS' AND ended_at IS NULL) OR
            (status IN ('COMPLETED', 'ABANDONED') AND ended_at IS NOT NULL)
        ),

    CONSTRAINT chk_games_ended_after_started
        CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_status_num_steps ON games(status, num_steps);

-- ------------------------------------------------------------
-- 3. GAME_STEPS — percorso effettuato (pagine visitate, in ordine)
-- ------------------------------------------------------------
CREATE TABLE game_steps (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id     BIGINT       NOT NULL,
    step_number INT          NOT NULL,
    page_title  VARCHAR(255) NOT NULL,
    visited_at  TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT fk_game_steps_game
        FOREIGN KEY (game_id) REFERENCES games(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_game_steps_game_step UNIQUE (game_id, step_number),

    CONSTRAINT chk_game_steps_step_number_positive
        CHECK (step_number >= 0)
);

CREATE INDEX idx_game_steps_game_id_step_number ON game_steps(game_id, step_number);