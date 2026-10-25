-- Citizen pothole reports. Run once against the database configured in DATABASE_URL.
create extension if not exists pgcrypto;

create table if not exists reportes (
  id text primary key default 'CJ-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  lat double precision not null check (lat between 26.99 and 27.12),
  lng double precision not null check (lng between -109.51 and -109.39),
  severidad smallint not null check (severidad between 1 and 3),
  descripcion text check (char_length(descripcion) <= 280),
  confianza_ia real check (confianza_ia between 0 and 1),
  apoyos integer not null default 1,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'reparado')),
  creado_en timestamptz not null default now(),
  reparado_en timestamptz,
  reabierto boolean not null default false
);

create index if not exists reportes_creado_en_idx on reportes (creado_en desc);
