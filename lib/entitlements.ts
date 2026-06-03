import { query } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { Plan } from "@/lib/types";
import { normalizePlanId } from "@/lib/plan-access";
import { normalizeMemberEmail } from "@/lib/member-identity";

export async function getPlanForEmail(email: string): Promise<Plan> {
  const rows = await query<{ plan: string }[]>("SELECT plan FROM users WHERE email = ? LIMIT 1", [normalizeMemberEmail(email)]);
  return getPlan(normalizePlanId(rows[0]?.plan));
}
