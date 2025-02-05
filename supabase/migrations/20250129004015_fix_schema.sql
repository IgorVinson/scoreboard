-- First, drop the plans table because it depends on indicators
DROP TABLE IF EXISTS plans CASCADE;

-- Now we can drop the other tables
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS indicators CASCADE;
DROP TABLE IF EXISTS results CASCADE;

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE metric_type AS ENUM ('NUMERIC', 'PERCENTAGE', 'BOOLEAN');
    CREATE TYPE measurement_unit AS ENUM ('NUMBER', 'PERCENTAGE', 'TEXT');
    CREATE TYPE plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate tables in correct order
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

CREATE TABLE plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id uuid REFERENCES metrics(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    target_value numeric NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status plan_status DEFAULT 'DRAFT',
    last_edited_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
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

-- Add indexes for better performance
CREATE INDEX idx_metrics_company ON metrics(company_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date);
CREATE INDEX idx_plans_dates ON plans(start_date, end_date); 