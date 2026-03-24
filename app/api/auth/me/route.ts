import { NextResponse } from "next/server";
import { getMockCurrentUser } from "@/lib/current-user";

export async function GET(req: Request) {
  const user = await getMockCurrentUser(req);

  return NextResponse.json({
    ok: true,
    user,
  });
}