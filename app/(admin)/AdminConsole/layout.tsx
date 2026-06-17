import type { Metadata } from "next";
import AdminConsoleClient from "./AdminConsoleClient";

export const metadata: Metadata = {
  title: "ValuStock Admin Console",
  description: "Private ValuStock administration console.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminConsoleClient>{children}</AdminConsoleClient>;
}
