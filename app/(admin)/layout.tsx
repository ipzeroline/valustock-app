import { StoreProvider } from "@/lib/store";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider>{children}</StoreProvider>;
}
