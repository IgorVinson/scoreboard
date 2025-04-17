create type "public"."measurement_unit" as enum ('NUMBER', 'PERCENTAGE', 'TEXT');

create type "public"."metric_type" as enum ('NUMERIC', 'PERCENTAGE', 'BOOLEAN');

create type "public"."plan_status" as enum ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

drop trigger if exists "update_daily_notes_updated_at" on "public"."daily_notes";

drop trigger if exists "update_grades_updated_at" on "public"."grades";

drop trigger if exists "update_indicators_updated_at" on "public"."indicators";

drop trigger if exists "update_results_updated_at" on "public"."results";

drop trigger if exists "update_user_preferences_updated_at" on "public"."user_preferences";

drop policy "Users can create their own daily notes" on "public"."daily_notes";

drop policy "Users can update their own daily notes" on "public"."daily_notes";

drop policy "Users can view their own daily notes" on "public"."daily_notes";

drop policy "Users can create their own results" on "public"."results";

drop policy "Users can create their own preferences" on "public"."user_preferences";

drop policy "Users can update their own preferences" on "public"."user_preferences";

drop policy "Users can view their own preferences" on "public"."user_preferences";

drop policy "Users can update their own profile" on "public"."users";

drop policy "Users can view their own profile" on "public"."users";

revoke delete on table "public"."daily_notes" from "anon";

revoke insert on table "public"."daily_notes" from "anon";

revoke references on table "public"."daily_notes" from "anon";

revoke select on table "public"."daily_notes" from "anon";

revoke trigger on table "public"."daily_notes" from "anon";

revoke truncate on table "public"."daily_notes" from "anon";

revoke update on table "public"."daily_notes" from "anon";

revoke delete on table "public"."daily_notes" from "authenticated";

revoke insert on table "public"."daily_notes" from "authenticated";

revoke references on table "public"."daily_notes" from "authenticated";

revoke select on table "public"."daily_notes" from "authenticated";

revoke trigger on table "public"."daily_notes" from "authenticated";

revoke truncate on table "public"."daily_notes" from "authenticated";

revoke update on table "public"."daily_notes" from "authenticated";

revoke delete on table "public"."daily_notes" from "service_role";

revoke insert on table "public"."daily_notes" from "service_role";

revoke references on table "public"."daily_notes" from "service_role";

revoke select on table "public"."daily_notes" from "service_role";

revoke trigger on table "public"."daily_notes" from "service_role";

revoke truncate on table "public"."daily_notes" from "service_role";

revoke update on table "public"."daily_notes" from "service_role";

revoke delete on table "public"."grades" from "anon";

revoke insert on table "public"."grades" from "anon";

revoke references on table "public"."grades" from "anon";

revoke select on table "public"."grades" from "anon";

revoke trigger on table "public"."grades" from "anon";

revoke truncate on table "public"."grades" from "anon";

revoke update on table "public"."grades" from "anon";

revoke delete on table "public"."grades" from "authenticated";

revoke insert on table "public"."grades" from "authenticated";

revoke references on table "public"."grades" from "authenticated";

revoke select on table "public"."grades" from "authenticated";

revoke trigger on table "public"."grades" from "authenticated";

revoke truncate on table "public"."grades" from "authenticated";

revoke update on table "public"."grades" from "authenticated";

revoke delete on table "public"."grades" from "service_role";

revoke insert on table "public"."grades" from "service_role";

revoke references on table "public"."grades" from "service_role";

revoke select on table "public"."grades" from "service_role";

revoke trigger on table "public"."grades" from "service_role";

revoke truncate on table "public"."grades" from "service_role";

revoke update on table "public"."grades" from "service_role";

revoke delete on table "public"."indicators" from "anon";

revoke insert on table "public"."indicators" from "anon";

revoke references on table "public"."indicators" from "anon";

revoke select on table "public"."indicators" from "anon";

revoke trigger on table "public"."indicators" from "anon";

revoke truncate on table "public"."indicators" from "anon";

revoke update on table "public"."indicators" from "anon";

revoke delete on table "public"."indicators" from "authenticated";

revoke insert on table "public"."indicators" from "authenticated";

revoke references on table "public"."indicators" from "authenticated";

revoke select on table "public"."indicators" from "authenticated";

revoke trigger on table "public"."indicators" from "authenticated";

revoke truncate on table "public"."indicators" from "authenticated";

revoke update on table "public"."indicators" from "authenticated";

revoke delete on table "public"."indicators" from "service_role";

revoke insert on table "public"."indicators" from "service_role";

revoke references on table "public"."indicators" from "service_role";

revoke select on table "public"."indicators" from "service_role";

revoke trigger on table "public"."indicators" from "service_role";

revoke truncate on table "public"."indicators" from "service_role";

revoke update on table "public"."indicators" from "service_role";

revoke delete on table "public"."results" from "anon";

revoke insert on table "public"."results" from "anon";

revoke references on table "public"."results" from "anon";

revoke select on table "public"."results" from "anon";

revoke trigger on table "public"."results" from "anon";

revoke truncate on table "public"."results" from "anon";

revoke update on table "public"."results" from "anon";

revoke delete on table "public"."results" from "authenticated";

revoke insert on table "public"."results" from "authenticated";

revoke references on table "public"."results" from "authenticated";

revoke select on table "public"."results" from "authenticated";

revoke trigger on table "public"."results" from "authenticated";

revoke truncate on table "public"."results" from "authenticated";

revoke update on table "public"."results" from "authenticated";

revoke delete on table "public"."results" from "service_role";

revoke insert on table "public"."results" from "service_role";

revoke references on table "public"."results" from "service_role";

revoke select on table "public"."results" from "service_role";

revoke trigger on table "public"."results" from "service_role";

revoke truncate on table "public"."results" from "service_role";

revoke update on table "public"."results" from "service_role";

revoke delete on table "public"."user_preferences" from "anon";

revoke insert on table "public"."user_preferences" from "anon";

revoke references on table "public"."user_preferences" from "anon";

revoke select on table "public"."user_preferences" from "anon";

revoke trigger on table "public"."user_preferences" from "anon";

revoke truncate on table "public"."user_preferences" from "anon";

revoke update on table "public"."user_preferences" from "anon";

revoke delete on table "public"."user_preferences" from "authenticated";

revoke insert on table "public"."user_preferences" from "authenticated";

revoke references on table "public"."user_preferences" from "authenticated";

revoke select on table "public"."user_preferences" from "authenticated";

revoke trigger on table "public"."user_preferences" from "authenticated";

revoke truncate on table "public"."user_preferences" from "authenticated";

revoke update on table "public"."user_preferences" from "authenticated";

revoke delete on table "public"."user_preferences" from "service_role";

revoke insert on table "public"."user_preferences" from "service_role";

revoke references on table "public"."user_preferences" from "service_role";

revoke select on table "public"."user_preferences" from "service_role";

revoke trigger on table "public"."user_preferences" from "service_role";

revoke truncate on table "public"."user_preferences" from "service_role";

revoke update on table "public"."user_preferences" from "service_role";

alter table "public"."daily_notes" drop constraint "daily_notes_user_id_date_key";

alter table "public"."daily_notes" drop constraint "daily_notes_user_id_fkey";

alter table "public"."grades" drop constraint "grades_quality_score_check";

alter table "public"."grades" drop constraint "grades_quantity_score_check";

alter table "public"."grades" drop constraint "grades_result_id_fkey";

alter table "public"."plans" drop constraint "plans_indicator_id_fkey";

alter table "public"."results" drop constraint "results_indicator_id_fkey";

alter table "public"."user_preferences" drop constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" drop constraint "user_preferences_user_id_key_key";

alter table "public"."users" drop constraint "users_role_check";

alter table "public"."teams" drop constraint "teams_company_id_fkey";

alter table "public"."users" drop constraint "users_company_id_fkey";

alter table "public"."users" drop constraint "users_team_id_fkey";

alter table "public"."daily_notes" drop constraint "daily_notes_pkey";

alter table "public"."grades" drop constraint "grades_pkey";

alter table "public"."indicators" drop constraint "indicators_pkey";

alter table "public"."results" drop constraint "results_pkey";

alter table "public"."user_preferences" drop constraint "user_preferences_pkey";

drop index if exists "public"."daily_notes_pkey";

drop index if exists "public"."daily_notes_user_id_date_key";

drop index if exists "public"."grades_pkey";

drop index if exists "public"."indicators_pkey";

drop index if exists "public"."results_pkey";

drop index if exists "public"."user_preferences_pkey";

drop index if exists "public"."user_preferences_user_id_key_key";

drop table "public"."daily_notes";

drop table "public"."grades";

drop table "public"."indicators";

drop table "public"."results";

drop table "public"."user_preferences";

create table "public"."daily_reports" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "date" date not null,
    "metrics_data" jsonb,
    "today_notes" text,
    "tomorrow_notes" text,
    "general_comments" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."daily_reports" enable row level security;

create table "public"."metric_owners" (
    "metric_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."metric_owners" enable row level security;

create table "public"."metrics" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "type" metric_type not null,
    "measurement_unit" measurement_unit not null,
    "company_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."metrics" enable row level security;

alter table "public"."companies" alter column "created_at" set default now();

alter table "public"."companies" alter column "created_at" drop not null;

alter table "public"."companies" alter column "id" set default uuid_generate_v4();

alter table "public"."companies" alter column "updated_at" set default now();

alter table "public"."companies" alter column "updated_at" drop not null;

alter table "public"."plans" drop column "employee_id";

alter table "public"."plans" drop column "indicator_id";

alter table "public"."plans" add column "last_edited_by" uuid;

alter table "public"."plans" add column "metric_id" uuid;

alter table "public"."plans" add column "status" plan_status default 'DRAFT'::plan_status;

alter table "public"."plans" add column "user_id" uuid;

alter table "public"."teams" alter column "company_id" drop not null;

alter table "public"."teams" alter column "created_at" set default now();

alter table "public"."teams" alter column "created_at" drop not null;

alter table "public"."teams" alter column "id" set default uuid_generate_v4();

alter table "public"."teams" alter column "updated_at" set default now();

alter table "public"."teams" alter column "updated_at" drop not null;

alter table "public"."users" drop column "name";

alter table "public"."users" add column "first_name" text;

alter table "public"."users" add column "last_name" text;

alter table "public"."users" add column "phone_number" text;

alter table "public"."users" add column "profile_completed" boolean default false;

alter table "public"."users" alter column "created_at" set default now();

alter table "public"."users" alter column "created_at" drop not null;

alter table "public"."users" alter column "updated_at" set default now();

alter table "public"."users" alter column "updated_at" drop not null;

CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name);

CREATE UNIQUE INDEX daily_reports_pkey ON public.daily_reports USING btree (id);

CREATE UNIQUE INDEX daily_reports_user_id_date_key ON public.daily_reports USING btree (user_id, date);

CREATE INDEX idx_daily_reports_date ON public.daily_reports USING btree (date);

CREATE INDEX idx_metrics_company ON public.metrics USING btree (company_id);

CREATE INDEX idx_plans_dates ON public.plans USING btree (start_date, end_date);

CREATE INDEX idx_users_company ON public.users USING btree (company_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_team ON public.users USING btree (team_id);

CREATE UNIQUE INDEX metric_owners_pkey ON public.metric_owners USING btree (metric_id, user_id);

CREATE UNIQUE INDEX metrics_pkey ON public.metrics USING btree (id);

alter table "public"."daily_reports" add constraint "daily_reports_pkey" PRIMARY KEY using index "daily_reports_pkey";

alter table "public"."metric_owners" add constraint "metric_owners_pkey" PRIMARY KEY using index "metric_owners_pkey";

alter table "public"."metrics" add constraint "metrics_pkey" PRIMARY KEY using index "metrics_pkey";

alter table "public"."companies" add constraint "companies_name_key" UNIQUE using index "companies_name_key";

alter table "public"."daily_reports" add constraint "daily_reports_user_id_date_key" UNIQUE using index "daily_reports_user_id_date_key";

alter table "public"."daily_reports" add constraint "daily_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."daily_reports" validate constraint "daily_reports_user_id_fkey";

alter table "public"."metric_owners" add constraint "metric_owners_metric_id_fkey" FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE not valid;

alter table "public"."metric_owners" validate constraint "metric_owners_metric_id_fkey";

alter table "public"."metric_owners" add constraint "metric_owners_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."metric_owners" validate constraint "metric_owners_user_id_fkey";

alter table "public"."metrics" add constraint "metrics_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."metrics" validate constraint "metrics_company_id_fkey";

alter table "public"."plans" add constraint "plans_last_edited_by_fkey" FOREIGN KEY (last_edited_by) REFERENCES users(id) not valid;

alter table "public"."plans" validate constraint "plans_last_edited_by_fkey";

alter table "public"."plans" add constraint "plans_metric_id_fkey" FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE not valid;

alter table "public"."plans" validate constraint "plans_metric_id_fkey";

alter table "public"."plans" add constraint "plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."plans" validate constraint "plans_user_id_fkey";

alter table "public"."plans" add constraint "valid_dates" CHECK ((end_date >= start_date)) not valid;

alter table "public"."plans" validate constraint "valid_dates";

alter table "public"."teams" add constraint "teams_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."teams" validate constraint "teams_company_id_fkey";

alter table "public"."users" add constraint "users_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_company_id_fkey";

alter table "public"."users" add constraint "users_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_team_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_profile_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.profile_completed = (
        NEW.first_name IS NOT NULL AND
        NEW.last_name IS NOT NULL AND
        NEW.phone_number IS NOT NULL AND
        NEW.team_id IS NOT NULL AND
        NEW.company_id IS NOT NULL
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$function$
;

grant delete on table "public"."daily_reports" to "anon";

grant insert on table "public"."daily_reports" to "anon";

grant references on table "public"."daily_reports" to "anon";

grant select on table "public"."daily_reports" to "anon";

grant trigger on table "public"."daily_reports" to "anon";

grant truncate on table "public"."daily_reports" to "anon";

grant update on table "public"."daily_reports" to "anon";

grant delete on table "public"."daily_reports" to "authenticated";

grant insert on table "public"."daily_reports" to "authenticated";

grant references on table "public"."daily_reports" to "authenticated";

grant select on table "public"."daily_reports" to "authenticated";

grant trigger on table "public"."daily_reports" to "authenticated";

grant truncate on table "public"."daily_reports" to "authenticated";

grant update on table "public"."daily_reports" to "authenticated";

grant delete on table "public"."daily_reports" to "service_role";

grant insert on table "public"."daily_reports" to "service_role";

grant references on table "public"."daily_reports" to "service_role";

grant select on table "public"."daily_reports" to "service_role";

grant trigger on table "public"."daily_reports" to "service_role";

grant truncate on table "public"."daily_reports" to "service_role";

grant update on table "public"."daily_reports" to "service_role";

grant delete on table "public"."metric_owners" to "anon";

grant insert on table "public"."metric_owners" to "anon";

grant references on table "public"."metric_owners" to "anon";

grant select on table "public"."metric_owners" to "anon";

grant trigger on table "public"."metric_owners" to "anon";

grant truncate on table "public"."metric_owners" to "anon";

grant update on table "public"."metric_owners" to "anon";

grant delete on table "public"."metric_owners" to "authenticated";

grant insert on table "public"."metric_owners" to "authenticated";

grant references on table "public"."metric_owners" to "authenticated";

grant select on table "public"."metric_owners" to "authenticated";

grant trigger on table "public"."metric_owners" to "authenticated";

grant truncate on table "public"."metric_owners" to "authenticated";

grant update on table "public"."metric_owners" to "authenticated";

grant delete on table "public"."metric_owners" to "service_role";

grant insert on table "public"."metric_owners" to "service_role";

grant references on table "public"."metric_owners" to "service_role";

grant select on table "public"."metric_owners" to "service_role";

grant trigger on table "public"."metric_owners" to "service_role";

grant truncate on table "public"."metric_owners" to "service_role";

grant update on table "public"."metric_owners" to "service_role";

grant delete on table "public"."metrics" to "anon";

grant insert on table "public"."metrics" to "anon";

grant references on table "public"."metrics" to "anon";

grant select on table "public"."metrics" to "anon";

grant trigger on table "public"."metrics" to "anon";

grant truncate on table "public"."metrics" to "anon";

grant update on table "public"."metrics" to "anon";

grant delete on table "public"."metrics" to "authenticated";

grant insert on table "public"."metrics" to "authenticated";

grant references on table "public"."metrics" to "authenticated";

grant select on table "public"."metrics" to "authenticated";

grant trigger on table "public"."metrics" to "authenticated";

grant truncate on table "public"."metrics" to "authenticated";

grant update on table "public"."metrics" to "authenticated";

grant delete on table "public"."metrics" to "service_role";

grant insert on table "public"."metrics" to "service_role";

grant references on table "public"."metrics" to "service_role";

grant select on table "public"."metrics" to "service_role";

grant trigger on table "public"."metrics" to "service_role";

grant truncate on table "public"."metrics" to "service_role";

grant update on table "public"."metrics" to "service_role";

create policy "Users can view their own company"
on "public"."companies"
as permissive
for select
to public
using ((id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Users can create their own daily reports"
on "public"."daily_reports"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can view their daily reports"
on "public"."daily_reports"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can view metrics in their company"
on "public"."metrics"
as permissive
for select
to public
using ((company_id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Users can view their plans"
on "public"."plans"
as permissive
for select
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'MANAGER'::text) AND (users.team_id IN ( SELECT users_1.team_id
           FROM users users_1
          WHERE (users_1.id = plans.user_id))))))));


create policy "Users can view teams in their company"
on "public"."teams"
as permissive
for select
to public
using ((company_id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Allow insert for new users"
on "public"."users"
as permissive
for insert
to public
with check (true);


create policy "Users can update their own data"
on "public"."users"
as permissive
for update
to public
using ((id = auth.uid()));


create policy "Users can view other users in their company"
on "public"."users"
as permissive
for select
to public
using ((company_id IN ( SELECT users_1.company_id
   FROM users users_1
  WHERE (users_1.id = auth.uid()))));


CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON public.metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


