import { AssetType, Plan, PlanId } from "@/lib/types";

const validPlans: PlanId[] = ["free", "pro", "premium", "lifetime"];

export function normalizePlanId(plan: unknown): PlanId {
  return typeof plan === "string" && validPlans.includes(plan as PlanId) ? (plan as PlanId) : "free";
}

export function requiredPlanForAsset(assetType: AssetType | undefined): PlanId {
  if (assetType === "CRYPTO" || assetType === "FUTURES") return "premium";
  if (assetType === "FUND" || assetType === "US_FUND" || assetType === "ETF") return "pro";
  return "free";
}

export function assetAllowed(plan: Plan, assetType: AssetType | undefined): boolean {
  return plan.limits.assetClasses.includes(assetType || "TH_STOCK");
}
