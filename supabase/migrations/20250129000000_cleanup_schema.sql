-- Drop existing tables if they exist
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS metric_owners CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS metric_type CASCADE;
DROP TYPE IF EXISTS measurement_unit CASCADE;
DROP TYPE IF EXISTS plan_status CASCADE; 