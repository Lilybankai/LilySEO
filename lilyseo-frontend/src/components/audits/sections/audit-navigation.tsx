"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FileText, BarChart, Globe, Zap, Users, Rocket, ArrowRight, BrainCog } from "lucide-react"

interface AuditNavigationProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AuditNavigation({ activeSection, onSectionChange }: AuditNavigationProps) {
  const handleClick = (sectionId: string) => {
    if (onSectionChange) {
      onSectionChange(sectionId);
    } else {
      // Default scroll behavior if no callback is provided
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const sections = [
    {
      id: "executive-summary",
      label: "Executive Summary",
      icon: <BarChart className="w-4 h-4 mr-2" />,
    },
    {
      id: "action-plan",
      label: "Action Plan",
      icon: <Rocket className="w-4 h-4 mr-2" />,
    },
    {
      id: "technical-seo",
      label: "Technical SEO",
      icon: <Globe className="w-4 h-4 mr-2" />,
    },
    {
      id: "on-page-seo",
      label: "On-Page SEO",
      icon: <FileText className="w-4 h-4 mr-2" />,
    },
    {
      id: "off-page-seo",
      label: "Off-Page SEO",
      icon: <Globe className="w-4 h-4 mr-2" />,
    },
    {
      id: "user-experience",
      label: "User Experience",
      icon: <Users className="w-4 h-4 mr-2" />,
    },
    {
      id: "page-speed",
      label: "Page Speed",
      icon: <Zap className="w-4 h-4 mr-2" />,
    },
    {
      id: "ai-recommendations",
      label: "AI Recommendations",
      icon: <BrainCog className="w-4 h-4 mr-2" />,
    },
  ];

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-3 font-medium border-b">Audit Report Sections</div>
      <div className="p-2">
        <div className="space-y-1">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeSection === section.id ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => handleClick(section.id)}
            >
              {section.icon}
              {section.label}
              {activeSection === section.id && (
                <ArrowRight className="w-4 h-4 ml-auto" />
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 