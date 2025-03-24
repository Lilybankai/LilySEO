"use client";

import { createContext, useState, useContext, ReactNode } from 'react';

// PDF Theme types
export interface PdfTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName: string;
  logoUrl?: string;
  contactInfo?: string;
  footerText?: string;
  // New customization options
  pageSize: 'A4' | 'LETTER' | 'LEGAL';
  colorMode: 'Full' | 'Grayscale';
  outputQuality: 'Draft' | 'Standard' | 'High';
  includeOptions: {
    executiveSummary: boolean;
    technicalSEO: boolean;
    onPageSEO: boolean;
    offPageSEO: boolean;
    performance: boolean;
    userExperience: boolean;
    insights: boolean;
    recommendations: boolean;
    charts: boolean;
    branding: boolean;
  };
}

interface ThemeContextType {
  theme: PdfTheme;
  updateTheme: (newSettings: Partial<PdfTheme>) => void;
}

// Default theme based on LilySEO theme guide
const defaultTheme: PdfTheme = {
  primaryColor: 'hsl(220 70% 50%)', // From theme guide
  secondaryColor: '#4b5563',
  fontFamily: 'Poppins, Montserrat, sans-serif', // From theme guide
  companyName: 'LilySEO',
  contactInfo: 'support@lilyseo.com',
  footerText: `© ${new Date().getFullYear()} LilySEO. All rights reserved.`,
  // Default customization options
  pageSize: 'A4',
  colorMode: 'Full',
  outputQuality: 'Standard',
  includeOptions: {
    executiveSummary: true,
    technicalSEO: true,
    onPageSEO: true,
    offPageSEO: true,
    performance: true,
    userExperience: true,
    insights: true,
    recommendations: true,
    charts: true,
    branding: true
  }
};

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {},
});

// Custom hook for using the theme
export function usePdfTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Partial<PdfTheme>;
}

export function PdfThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<PdfTheme>({
    ...defaultTheme,
    ...initialTheme,
    // Ensure includeOptions is merged correctly
    includeOptions: {
      ...defaultTheme.includeOptions,
      ...(initialTheme?.includeOptions || {})
    }
  });

  const updateTheme = (newSettings: Partial<PdfTheme>) => {
    setTheme((prev) => ({
      ...prev,
      ...newSettings,
      // Handle nested includeOptions correctly
      includeOptions: {
        ...prev.includeOptions,
        ...(newSettings.includeOptions || {})
      }
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
} 