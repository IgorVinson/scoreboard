-- Add RLS policies to allow operations on metrics table
CREATE POLICY "Allow insert for authenticated users" ON metrics FOR INSERT TO authenticated WITH CHECK (true);
