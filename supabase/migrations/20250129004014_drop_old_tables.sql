-- Drop old tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS indicators CASCADE;
DROP TABLE IF EXISTS results CASCADE;

-- Recreate the tables from divine_prism migration that might have been missed
CREATE TABLE metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    type metric_type NOT NULL,
    measurement_unit measurement_unit NOT NULL,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE metric_owners (
    metric_id uuid REFERENCES metrics(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (metric_id, user_id)
);

CREATE TABLE daily_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,
    metrics_data jsonb,
    today_notes text,
    tomorrow_notes text,
    general_comments text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
); 