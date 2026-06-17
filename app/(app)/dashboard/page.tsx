import { readInitialMarketUniverse } from "@/lib/server-market-universe";
import DashboardClient from "./DashboardClient";

export const revalidate = 60;

export default async function DashboardPage() {
  const initialMarketUniverse = await readInitialMarketUniverse(90);
  return <DashboardClient initialMarketUniverse={initialMarketUniverse} />;
}
