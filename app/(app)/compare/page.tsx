import { readInitialMarketUniverse } from "@/lib/server-market-universe";
import CompareClient from "./CompareClient";

export const revalidate = 60;

export default async function ComparePage() {
  const initialMarketUniverse = await readInitialMarketUniverse(160);
  return <CompareClient initialMarketUniverse={initialMarketUniverse?.stocks || []} />;
}
