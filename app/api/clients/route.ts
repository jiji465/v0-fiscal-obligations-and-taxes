export const runtime = "nodejs"
import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { ensureSchema } from "@/lib/db"

export async function GET() {
  await ensureSchema()
  const { rows } = await sql`select * from clients order by created_at asc`
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  await ensureSchema()
  await sql`
    insert into clients (id, name, cnpj, email, phone, status, created_at)
    values (${body.id}, ${body.name}, ${body.cnpj}, ${body.email}, ${body.phone}, ${body.status}, ${body.createdAt})
    on conflict (id) do update set
      name = excluded.name,
      cnpj = excluded.cnpj,
      email = excluded.email,
      phone = excluded.phone,
      status = excluded.status
  `
  return NextResponse.json(body, { status: 201 })
}


