import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table Read",
  description: "Table Read Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
