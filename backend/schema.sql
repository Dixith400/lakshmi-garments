create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  category text default 'garments',
  price numeric not null,
  stock integer not null default 0,
  sizes text[] default '{}',
  colors text[] default '{}',
  sold_count integer not null default 0,
  image_url text default '',
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text default '',
  total numeric not null,
  payment_method text not null,          -- 'cod' | 'razorpay'
  payment_status text not null,          -- 'cod_pending' | 'unpaid' | 'paid' | 'failed'
  status text not null default 'pending',-- pending | confirmed | delivered | cancelled
  razorpay_order_id text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text,
  size text,
  color text,
  quantity integer not null,
  unit_price numeric not null
);

create table if not exists shop_settings (
  id int primary key default 1,
  shop_name text default 'Lakshmi Garments and Jewelry',
  address text default 'Main Bazaar Road, Your City',
  phone text default '+91 90000 00000',
  logo_url text default 'https://media.base44.com/images/public/6aae82cb01188ac2783c82e6/ac99a0ac8_generated_image.png'
);

insert into shop_settings (id) values (1) on conflict (id) do nothing;

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shop_settings enable row level security;
