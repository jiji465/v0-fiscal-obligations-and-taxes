import { NextResponse } from "next/server"
import kv from "@/lib/kv"

const KEY = "fiscal:taxes"

export async function GET() {
  const items = (await kv.get(KEY)) as any[] | null
  return NextResponse.json(items || [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const items = ((await kv.get(KEY)) as any[] | null) || []
  const existingIndex = items.findIndex((t) => t.id === body.id)
  if (existingIndex >= 0) items[existingIndex] = body
  else items.push(body)
  await kv.set(KEY, items)
  return NextResponse.json(body, { status: 201 })
}


