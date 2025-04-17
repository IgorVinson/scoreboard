-- First, let's check the existing policies
SELECT * FROM pg_policies WHERE tablename = 'metrics';

-- Drop all existing policies on the metrics table
-- (Uncomment these lines after reviewing the existing policies)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies 
        WHERE tablename = 'metrics'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON metrics', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Create new policies that don't use company_id
-- Policy for SELECT
CREATE POLICY "Users can view all metrics" 
ON metrics FOR SELECT 
TO authenticated
USING (true);

-- Policy for INSERT 
CREATE POLICY "Users can insert metrics" 
ON metrics FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE
CREATE POLICY "Users can update metrics" 
ON metrics FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE
CREATE POLICY "Users can delete metrics" 
ON metrics FOR DELETE 
TO authenticated
USING (true);

-- Ensure RLS is enabled on the metrics table
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Check the new policies
SELECT * FROM pg_policies WHERE tablename = 'metrics'; 