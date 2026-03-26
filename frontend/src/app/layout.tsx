import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { DM_Sans } from "next/font/google";
import { NextAuthProvider } from "@/components/session-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Cateeet",
  description: "Personal finance tracker",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>{children}</NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
