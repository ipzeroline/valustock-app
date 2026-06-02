import { query } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { Plan } from "@/lib/types";
import { normalizePlanId } from "@/lib/plan-access";

export async function getPlanForEmail(email: string): Promise<Plan> {
  const rows = await query<{ plan: string }[]>("SELECT plan FROM users WHERE email = ? LIMIT 1", [email]);
  return getPlan(normalizePlanId(rows[0]?.plan));
}
