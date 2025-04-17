/*
  # Initial Schema Setup

  1. Enums
    - UserRole: ADMIN, MANAGER, EMPLOYEE
    - IndicatorType: NUMERIC, PERCENTAGE, BOOLEAN

  2. Tables
    - companies: Base organization table
    - teams: Team groups within companies
    - users: User management with authentication
    - indicators: Performance metrics
    - plans: Target setting for indicators
    - results: Daily performance records
    - grades: Performance evaluations

  3. Security
    - RLS policies for each table
    - Authentication integration
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE indicator_type AS ENUM ('NUMERIC', 'PERCENTAGE', 'BOOLEAN');

-- Companies
CREATE TABLE companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Teams
CREATE TABLE teams (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Override default auth.users to extend it
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() REFERENCES auth.users,
    email text NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    first_name text,
    last_name text,
    team_id uuid REFERENCES teams(id),
    company_id uuid REFERENCES companies(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indicators
CREATE TABLE indicators (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    type indicator_type NOT NULL,
    measurement_unit text,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Objectives
CREATE TABLE objectives (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Objective Metrics
CREATE TABLE objective_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id uuid REFERENCES objectives(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    plan numeric,
    plan_period text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Plans
CREATE TABLE plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id uuid REFERENCES indicators(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES users(id) ON DELETE CASCADE,
    target_value numeric NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Results
CREATE TABLE results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id uuid REFERENCES indicators(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES users(id) ON DELETE CASCADE,
    value numeric NOT NULL,
    comment text,
    date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Grades
CREATE TABLE grades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id uuid REFERENCES results(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES users(id) ON DELETE CASCADE,
    quality_score integer CHECK (quality_score BETWEEN 1 AND 10),
    quantity_score integer CHECK (quantity_score BETWEEN 1 AND 10),
    comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

-- Teams
CREATE POLICY "Users can view teams in their company"
    ON teams FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

-- Users
CREATE POLICY "Users can view other users in their company"
    ON users FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

-- Indicators
CREATE POLICY "Users can view indicators in their company"
    ON indicators FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM users WHERE users.id = auth.uid()
    ));

-- Plans
CREATE POLICY "Users can view their plans and managers can view team plans"
    ON plans FOR SELECT
    USING (
        employee_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'MANAGER'
            AND team_id IN (
                SELECT team_id FROM users WHERE users.id = plans.employee_id
            )
        )
    );

-- Results
CREATE POLICY "Users can view their results and managers can view team results"
    ON results FOR SELECT
    USING (
        employee_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'MANAGER'
            AND team_id IN (
                SELECT team_id FROM users WHERE users.id = results.employee_id
            )
        )
    );

CREATE POLICY "Users can create their own results"
    ON results FOR INSERT
    WITH CHECK (employee_id = auth.uid());

-- Grades
CREATE POLICY "Users can view their grades and managers can view/create grades"
    ON grades FOR SELECT
    USING (
        result_id IN (SELECT id FROM results WHERE employee_id = auth.uid())
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'MANAGER'
        )
    );

CREATE POLICY "Only managers can create grades"
    ON grades FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'MANAGER'
        )
    );

-- Objectives
CREATE POLICY "Users can view their own objectives" ON objectives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own objectives" ON objectives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives" ON objectives
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own objectives" ON objectives
    FOR DELETE USING (auth.uid() = user_id);

-- Objective Metrics
CREATE POLICY "Users can view metrics of their objectives" ON objective_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM objectives
            WHERE objectives.id = objective_metrics.objective_id
            AND objectives.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert metrics for their objectives" ON objective_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM objectives
            WHERE objectives.id = objective_metrics.objective_id
            AND objectives.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update metrics of their objectives" ON objective_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM objectives
            WHERE objectives.id = objective_metrics.objective_id
            AND objectives.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete metrics of their objectives" ON objective_metrics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM objectives
            WHERE objectives.id = objective_metrics.objective_id
            AND objectives.user_id = auth.uid()
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_results_updated_at
    BEFORE UPDATE ON results
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();