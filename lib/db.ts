import { sql } from "@vercel/postgres"

let initialized = false

export async function ensureSchema(): Promise<void> {
  if (initialized) return
  // Cria tabelas se não existirem
  await sql`
    create table if not exists clients (
      id text primary key,
      name text not null,
      cnpj text not null,
      email text,
      phone text,
      status text not null,
      created_at timestamptz default now()
    );

    create table if not exists taxes (
      id text primary key,
      name text not null,
      description text,
      federal_tax_code text,
      due_day int,
      status text not null,
      priority text not null,
      assigned_to text,
      protocol text,
      notes text,
      completed_at timestamptz,
      completed_by text,
      tags jsonb,
      created_at timestamptz default now()
    );

    create table if not exists obligations (
      id text primary key,
      name text not null,
      description text,
      category text not null,
      client_id text not null references clients(id) on delete cascade,
      tax_id text references taxes(id) on delete set null,
      due_day int not null,
      due_month int,
      frequency text not null,
      recurrence text not null,
      recurrence_interval int,
      recurrence_end_date date,
      auto_generate boolean not null default false,
      weekend_rule text not null,
      status text not null,
      priority text not null,
      assigned_to text,
      protocol text,
      realization_date date,
      amount numeric,
      notes text,
      created_at timestamptz default now(),
      completed_at timestamptz,
      completed_by text,
      attachments jsonb,
      parent_obligation_id text,
      generated_for text,
      tags jsonb
    );
  `
  initialized = true
}


