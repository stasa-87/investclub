CREATE TABLE IF NOT EXISTS app_metadata (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_metadata (id, name)
VALUES (1, 'investclub')
ON CONFLICT (id) DO NOTHING;
