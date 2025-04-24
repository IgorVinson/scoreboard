-- Add subscription related columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users (subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON public.users (stripe_subscription_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

COMMENT ON COLUMN public.users.subscription_status IS 'Possible values: inactive, active, trialing, past_due, canceled, etc.'; 