-- First, check the current policies
SELECT * FROM pg_policies WHERE tablename = 'metrics';

-- You may need to disable RLS temporarily for testing purposes
-- ALTER TABLE metrics DISABLE ROW LEVEL SECURITY;

-- If needed, create a policy that allows users to insert records
CREATE POLICY "Allow users to insert metrics" 
ON metrics FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create a policy for SELECT (viewing)
CREATE POLICY "Allow users to view metrics" 
ON metrics FOR SELECT 
TO authenticated
USING (true);

-- Create a policy for UPDATE (editing)
CREATE POLICY "Allow users to update metrics" 
ON metrics FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a policy for DELETE
CREATE POLICY "Allow users to delete metrics" 
ON metrics FOR DELETE 
TO authenticated
USING (true);

-- After setting up proper policies, you should enable RLS again
-- ALTER TABLE metrics ENABLE ROW LEVEL SECURITY; 