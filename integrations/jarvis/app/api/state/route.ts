import { NextResponse } from "next/server";
import { readLiveVaultState } from "@/lib/vault";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readLiveVaultState();
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
