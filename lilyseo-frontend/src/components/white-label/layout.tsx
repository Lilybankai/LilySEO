import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

interface WhiteLabelLayoutProps {
  children: ReactNode;
  logoUrl?: string;
  logoAlt?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showAuth?: boolean;
  showSocialLinks?: boolean;
  navigation?: Array<{
    name: string;
    href: string;
    current: boolean;
  }>;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  footerNavigation?: {
    main?: Array<{
      name: string;
      href: string;
    }>;
    legal?: Array<{
      name: string;
      href: string;
    }>;
  };
  customCopyright?: string;
}

export function WhiteLabelLayout({
  children,
  logoUrl,
  logoAlt,
  companyName,
  primaryColor,
  secondaryColor,
  showAuth,
  showSocialLinks,
  navigation,
  socialLinks,
  footerNavigation,
  customCopyright,
}: WhiteLabelLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        companyName={companyName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        showAuth={showAuth}
        navigation={navigation}
      />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        companyName={companyName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        showSocialLinks={showSocialLinks}
        socialLinks={socialLinks}
        navigation={footerNavigation}
        customCopyright={customCopyright}
      />
    </div>
  );
} 