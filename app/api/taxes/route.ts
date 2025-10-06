export const runtime = "nodejs"
import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { ensureSchema } from "@/lib/db"

export async function GET() {
  await ensureSchema()
  const { rows } = await sql`select * from taxes order by created_at asc`
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  await ensureSchema()
  await sql`
    insert into taxes (
      id, name, description, federal_tax_code, due_day, status, priority,
      assigned_to, protocol, notes, completed_at, completed_by, tags, created_at
    ) values (
      ${body.id}, ${body.name}, ${body.description}, ${body.federalTaxCode}, ${body.dueDay}, ${body.status}, ${body.priority},
      ${body.assignedTo}, ${body.protocol}, ${body.notes}, ${body.completedAt}, ${body.completedBy}, ${JSON.stringify(body.tags || [])}::jsonb, ${body.createdAt}
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      federal_tax_code = excluded.federal_tax_code,
      due_day = excluded.due_day,
      status = excluded.status,
      priority = excluded.priority,
      assigned_to = excluded.assigned_to,
      protocol = excluded.protocol,
      notes = excluded.notes,
      completed_at = excluded.completed_at,
      completed_by = excluded.completed_by,
      tags = excluded.tags
  `
  return NextResponse.json(body, { status: 201 })
}


