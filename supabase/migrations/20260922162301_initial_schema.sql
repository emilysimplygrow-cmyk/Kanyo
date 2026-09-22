create extension if not exists pgcrypto;

create type public.review_status as enum ('draft', 'published', 'hidden');
create type public.compatibility_status as enum ('good_match', 'potential_match', 'use_with_caution', 'not_enough_information');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_name text unique,
  locale text not null default 'en' check (locale in ('en', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  questionnaire_version text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_key)
);

create table public.skin_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_session_id uuid references public.assessment_sessions(id) on delete set null,
  rule_set_version text not null,
  profile jsonb not null,
  safety_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  slug text not null unique,
  name text not null,
  category text not null,
  description text,
  price_cents integer check (price_cents >= 0),
  currency text not null default 'EUR',
  data_transparency_score smallint check (data_transparency_score between 0 and 100),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  inci_name text not null unique,
  common_name text,
  description text,
  created_at timestamptz not null default now()
);

create table public.product_ingredients (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  position smallint,
  concentration_note text,
  primary key (product_id, ingredient_id)
);

create table public.compatibility_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  profile_snapshot_id uuid references public.skin_profile_snapshots(id) on delete set null,
  rule_set_version text not null,
  status public.compatibility_status not null,
  confidence smallint check (confidence between 0 and 100),
  reason_codes jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now(),
  unique (user_id, product_id, rule_set_version)
);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 1500),
  status public.review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.private_product_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  body text not null check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index assessment_sessions_user_id_idx on public.assessment_sessions(user_id, started_at desc);
create index skin_profile_snapshots_user_id_idx on public.skin_profile_snapshots(user_id, created_at desc);
create index products_published_category_idx on public.products(category) where is_published;
create index product_reviews_published_product_idx on public.product_reviews(product_id, created_at desc) where status = 'published';

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger product_reviews_updated_at before update on public.product_reviews for each row execute procedure public.set_updated_at();
create trigger private_product_notes_updated_at before update on public.private_product_notes for each row execute procedure public.set_updated_at();

-- This trigger only creates a profile for the newly-created auth user. It is not exposed as a public API.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, public_name, locale)
  values (new.id, 'kanyo-' || substr(new.id::text, 1, 8), coalesce(new.raw_user_meta_data ->> 'locale', 'en'));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.skin_profile_snapshots enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.compatibility_results enable row level security;
alter table public.product_reviews enable row level security;
alter table public.private_product_notes enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.brands, public.products, public.ingredients, public.product_ingredients to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.assessment_sessions, public.assessment_answers, public.skin_profile_snapshots, public.compatibility_results, public.product_reviews, public.private_product_notes to authenticated;
grant select on public.product_reviews to anon;

create policy "published catalog is readable" on public.brands for select to anon, authenticated using (true);
create policy "published products are readable" on public.products for select to anon, authenticated using (is_published = true);
create policy "ingredients are readable" on public.ingredients for select to anon, authenticated using (true);
create policy "product ingredients are readable" on public.product_ingredients for select to anon, authenticated using (true);

create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "users manage own sessions" on public.assessment_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own answers" on public.assessment_answers for all to authenticated using (exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = (select auth.uid()))) with check (exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy "users manage own snapshots" on public.skin_profile_snapshots for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users read own compatibility" on public.compatibility_results for select to authenticated using ((select auth.uid()) = user_id);

create policy "published reviews are public" on public.product_reviews for select to anon, authenticated using (status = 'published' or (select auth.uid()) = user_id);
create policy "users create own reviews" on public.product_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own reviews" on public.product_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own reviews" on public.product_reviews for delete to authenticated using ((select auth.uid()) = user_id);

create policy "users manage private notes" on public.private_product_notes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
