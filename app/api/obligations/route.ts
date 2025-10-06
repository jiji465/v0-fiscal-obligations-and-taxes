export const runtime = "nodejs"
import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { ensureSchema } from "@/lib/db"

export async function GET() {
  await ensureSchema()
  const { rows } = await sql`select * from obligations order by created_at asc`
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  await ensureSchema()
  await sql`
    insert into obligations (
      id, name, description, category, client_id, tax_id, due_day, due_month, frequency,
      recurrence, recurrence_interval, recurrence_end_date, auto_generate, weekend_rule, status, priority,
      assigned_to, protocol, realization_date, amount, notes, created_at, completed_at, completed_by,
      attachments, parent_obligation_id, generated_for, tags
    ) values (
      ${body.id}, ${body.name}, ${body.description}, ${body.category}, ${body.clientId}, ${body.taxId}, ${body.dueDay}, ${body.dueMonth}, ${body.frequency},
      ${body.recurrence}, ${body.recurrenceInterval}, ${body.recurrenceEndDate}, ${body.autoGenerate}, ${body.weekendRule}, ${body.status}, ${body.priority},
      ${body.assignedTo}, ${body.protocol}, ${body.realizationDate}, ${body.amount}, ${body.notes}, ${body.createdAt}, ${body.completedAt}, ${body.completedBy},
      ${JSON.stringify(body.attachments || [])}::jsonb, ${body.parentObligationId}, ${body.generatedFor}, ${JSON.stringify(body.tags || [])}::jsonb
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      client_id = excluded.client_id,
      tax_id = excluded.tax_id,
      due_day = excluded.due_day,
      due_month = excluded.due_month,
      frequency = excluded.frequency,
      recurrence = excluded.recurrence,
      recurrence_interval = excluded.recurrence_interval,
      recurrence_end_date = excluded.recurrence_end_date,
      auto_generate = excluded.auto_generate,
      weekend_rule = excluded.weekend_rule,
      status = excluded.status,
      priority = excluded.priority,
      assigned_to = excluded.assigned_to,
      protocol = excluded.protocol,
      realization_date = excluded.realization_date,
      amount = excluded.amount,
      notes = excluded.notes,
      completed_at = excluded.completed_at,
      completed_by = excluded.completed_by,
      attachments = excluded.attachments,
      parent_obligation_id = excluded.parent_obligation_id,
      generated_for = excluded.generated_for,
      tags = excluded.tags
  `
  return NextResponse.json(body, { status: 201 })
}


