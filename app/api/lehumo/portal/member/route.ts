import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const member = await getMemberById(session.memberId);

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Portal member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
