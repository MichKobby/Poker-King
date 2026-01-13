import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "Poker Night Master",
  description: "Track your bi-weekly poker night leaderboard and game history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
