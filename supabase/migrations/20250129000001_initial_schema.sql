-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE metric_type AS ENUM ('NUMERIC', 'PERCENTAGE', 'BOOLEAN');
CREATE TYPE measurement_unit AS ENUM ('NUMBER', 'PERCENTAGE', 'TEXT');
CREATE TYPE plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- Companies
CREATE TABLE companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Teams
CREATE TABLE teams (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Users (extending auth.users)
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    first_name text,
    last_name text,
    phone_number text,
    role text DEFAULT 'EMPLOYEE'::text,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
    profile_completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Metrics
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

-- Metric Owners (junction table for metrics-users many-to-many)
CREATE TABLE metric_owners (
    metric_id uuid REFERENCES metrics(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (metric_id, user_id)
);

-- Plans
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

-- Daily Reports
CREATE TABLE daily_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,
    metrics_data jsonb, -- Store metric values: {metric_id: {plan: value, fact: value}}
    today_notes text,
    tomorrow_notes text,
    general_comments text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Add indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_metrics_company ON metrics(company_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date);
CREATE INDEX idx_plans_dates ON plans(start_date, end_date);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can view teams in their company"
    ON teams FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can view other users in their company"
    ON users FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Allow insert for new users"
    ON users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view metrics in their company"
    ON metrics FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can view their plans"
    ON plans FOR SELECT
    USING (
        user_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'MANAGER'
            AND team_id IN (
                SELECT team_id FROM users WHERE users.id = plans.user_id
            )
        )
    );

CREATE POLICY "Users can view their daily reports"
    ON daily_reports FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own daily reports"
    ON daily_reports FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at
    BEFORE UPDATE ON metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 