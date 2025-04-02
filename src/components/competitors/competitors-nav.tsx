"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart2, FileText, GlobeIcon, Home } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function CompetitorsNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: "All Competitors",
      href: "/competitors",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      title: "Compare",
      href: "/competitors/compare",
      icon: <BarChart2 className="h-4 w-4 mr-2" />,
    },
    {
      title: "Content Analysis",
      href: "/competitors/content",
      icon: <FileText className="h-4 w-4 mr-2" />,
    },
    {
      title: "Market Position",
      href: "/competitors/market",
      icon: <GlobeIcon className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <div className="border-b">
      <div className="container flex items-center gap-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
} 