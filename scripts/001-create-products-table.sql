-- Create products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  brand text,
  price numeric,
  category text,
  purchase_date date,
  photo_url text,
  usage_status text check (usage_status in ('new', 'in progress', 'finished', 'want to repurchase')),
  rating integer check (rating between 1 and 5),
  inserted_at timestamp default now()
);

-- Enable RLS
alter table products enable row level security;

-- Create policy for users to manage their own products
create policy "User can manage own products"
  on products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
