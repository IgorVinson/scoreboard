-- Simple query to check RLS policies for metrics table
SELECT * FROM pg_policies WHERE tablename = 'metrics';
