import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import "./tailwind-import.css"; // Import the compiled Tailwind CSS
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/contexts/theme-context";

// Add console logs to help debug
console.log("Root layout rendering");
console.log("GeistSans variable:", GeistSans.variable);
console.log("GeistMono variable:", GeistMono.variable);

export const metadata: Metadata = {
  title: "LilySEO - Professional SEO Analysis",
  description: "Comprehensive SEO analysis and optimization tools",
  icons: {
    icon: '/Logos/LilySEO_logo_mark.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("Root layout function executing");
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider defaultTheme="light" storageKey="lily-theme">
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
