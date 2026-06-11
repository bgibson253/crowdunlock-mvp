import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST() { return NextResponse.json({ disabled: true }, { status: 410 }); }
export async function GET() { return NextResponse.json({ disabled: true }, { status: 410 }); }
