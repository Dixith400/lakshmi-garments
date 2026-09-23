-- ============================================================
-- LAKSHMI GARMENTS & JEWELRY — FULL SCHEMA (current, Sept 2026)
-- ============================================================

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
  created_at timestamptz default now(),
  category_id uuid
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table products
  drop constraint if exists products_category_id_fkey,
  add constraint products_category_id_fkey
    foreign key (category_id) references categories(id) on delete set null;

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  image_url text not null,
  created_at timestamptz default now()
);

alter table product_images
  drop constraint if exists product_images_product_id_fkey,
  add constraint product_images_product_id_fkey
    foreign key (product_id) references products(id) on delete cascade;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text default '',
  total numeric not null,
  payment_method text not null,
  payment_status text not null,
  status text not null default 'pending',
  razorpay_order_id text,
  created_at timestamptz default now(),
  shipping_address jsonb
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  product_name text,
  size text,
  color text,
  quantity integer not null,
  unit_price numeric not null
);

alter table order_items
  drop constraint if exists order_items_order_id_fkey,
  add constraint order_items_order_id_fkey
    foreign key (order_id) references orders(id) on delete cascade;

alter table order_items
  drop constraint if exists order_items_product_id_fkey,
  add constraint order_items_product_id_fkey
    foreign key (product_id) references products(id) on delete set null;

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  addressee_name text not null,
  address_line1 text not null,
  address_line2 text default '',
  city text not null,
  state text not null,
  pin_code text not null,
  country text not null default 'India',
  created_at timestamptz default now()
);

create table if not exists shop_settings (
  id int primary key default 1,
  shop_name text default 'Lakshmi Garments and Jewelry',
  address text default 'Main Bazaar Road, Your City',
  phone text default '+91 90000 00000',
  logo_url text default 'https://media.base44.com/images/public/6aae82cb01188ac2783c82e6/ac99a0ac8_generated_image.png',
  owner_photo_url text default ''
);

insert into shop_settings (id) values (1) on conflict (id) do nothing;

alter table products enable row level security;
alter table categories enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table addresses enable row level security;
alter table shop_settings enable row level security;

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid,
  size text default '',
  color text default '',
  quantity integer not null default 1,
  created_at timestamptz default now()
);

alter table cart_items
  drop constraint if exists cart_items_product_id_fkey,
  add constraint cart_items_product_id_fkey
    foreign key (product_id) references products(id) on delete cascade;

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid,
  created_at timestamptz default now()
);

alter table wishlist_items
  drop constraint if exists wishlist_items_product_id_fkey,
  add constraint wishlist_items_product_id_fkey
    foreign key (product_id) references products(id) on delete cascade;

alter table cart_items enable row level security;
alter table wishlist_items enable row level security;

