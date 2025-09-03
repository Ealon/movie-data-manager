import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";

export const metadata: Metadata = {
  title: "Movie DB",
  description: "Movie Database",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`Randy antialiased`}>
        <Background />
        {children}
      </body>
    </html>
  );
}
