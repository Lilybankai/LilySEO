import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import "./tailwind-import.css"; // Import the compiled Tailwind CSS

// Add console logs to help debug
console.log("Root layout rendering");
console.log("GeistSans variable:", GeistSans.variable);
console.log("GeistMono variable:", GeistMono.variable);

export const metadata: Metadata = {
  title: "LilySEO - Professional SEO Analysis",
  description: "Comprehensive SEO analysis and optimization tools",
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
        {children}
      </body>
    </html>
  );
}
