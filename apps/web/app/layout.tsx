import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoverOS",
  description: "Your intelligent moving co-pilot — plan, move, settle.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
