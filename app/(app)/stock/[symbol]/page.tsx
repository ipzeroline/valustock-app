import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ symbol: string }>;
};

export default async function LegacyStockRoute({ params }: Props) {
  const { symbol } = await params;
  permanentRedirect(`/stocks/${encodeURIComponent(symbol.toLowerCase())}`);
}
