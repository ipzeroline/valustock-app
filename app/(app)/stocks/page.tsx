import { readInitialMarketUniverse } from "@/lib/server-market-universe";
import StocksClient from "./StocksClient";

export const revalidate = 60;

export default async function StocksPage() {
  const initialMarketUniverse = await readInitialMarketUniverse(90);
  return <StocksClient initialMarketUniverse={initialMarketUniverse} />;
}
