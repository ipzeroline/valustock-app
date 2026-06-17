import { Analytics } from "@/components/Analytics";
import { Shell } from "@/components/Shell";
import { StoreProvider } from "@/lib/store";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <Analytics />
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
