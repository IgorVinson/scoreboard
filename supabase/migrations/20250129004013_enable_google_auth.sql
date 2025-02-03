-- Enable Google auth by allowing public access to auth.users
create policy "Allow public access to auth.users"
on auth.users for select
using (true);

-- Additional helpful policies for auth
create policy "Users can update their own metadata"
on auth.users for update
using (auth.uid() = id);

-- Enable row level security
alter table auth.users enable row level security; 