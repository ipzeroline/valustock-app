import { NextResponse } from "next/server";
import { requireMember } from "@/lib/member-auth";
import { normalizeMemberEmail } from "@/lib/member-identity";

export async function requireSameMemberEmail(req: Request, email: string) {
  const normalizedEmail = normalizeMemberEmail(email);
  if (!normalizedEmail) {
    return {
      error: NextResponse.json({ error: "Email is required" }, { status: 400 }),
      email: normalizedEmail,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return { error: null, email: normalizedEmail };
  }

  const { error, member } = await requireMember(req);
  if (error) return { error, email: normalizedEmail };

  if (member.email !== normalizedEmail) {
    return {
      error: NextResponse.json({ error: "Member email does not match authenticated session" }, { status: 403 }),
      email: normalizedEmail,
    };
  }

  return { error: null, email: normalizedEmail };
}
