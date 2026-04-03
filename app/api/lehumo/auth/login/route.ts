import { NextRequest, NextResponse } from "next/server";

import { findMemberByEmailAndNumber } from "@/lib/airtable";
import { createSession } from "@/lib/session";
import { LoginFormSchema } from "@/lib/definitions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, memberNumber } = parsed.data;

    const member = await findMemberByEmailAndNumber(email, memberNumber);

    if (!member) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await createSession(member.id, member.email, member.memberNumber, member.fullName);

    return NextResponse.json({
      name: member.fullName,
      memberNumber: member.memberNumber,
      status: member.status,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
