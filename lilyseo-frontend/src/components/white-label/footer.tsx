import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

interface FooterProps {
  logoUrl?: string;
  logoAlt?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showSocialLinks?: boolean;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  navigation?: {
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

export function Footer({
  logoUrl = "/logo.svg",
  logoAlt = "LilySEO",
  companyName = "LilySEO",
  primaryColor = "#4f46e5",
  secondaryColor = "#ffffff",
  showSocialLinks = true,
  socialLinks = {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  navigation = {
    main: [
      { name: "Home", href: "/" },
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Blog", href: "/blog" },
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  },
  customCopyright,
}: FooterProps) {
  // Generate styles based on props
  const footerStyle = {
    backgroundColor: primaryColor,
    color: secondaryColor,
  };
  
  const currentYear = new Date().getFullYear();
  const copyright = customCopyright || `© ${currentYear} ${companyName}. All rights reserved.`;
  
  // Ensure navigation properties exist
  const mainNavigation = navigation?.main || [];
  const legalNavigation = navigation?.legal || [];
  
  return (
    <footer className="relative" style={footerStyle}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              ) : (
                <span className="text-xl font-bold">{companyName}</span>
              )}
            </Link>
            <p className="text-base text-white text-opacity-70">
              Empowering businesses with actionable SEO insights and strategies to improve online visibility and drive organic growth.
            </p>
            
            {showSocialLinks && (
              <div className="flex space-x-6">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-opacity-70 hover:text-opacity-100"
                  >
                    <span className="sr-only">Facebook</span>
                    <Facebook className="h-6 w-6" />
                  </a>
                )}
                
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-opacity-70 hover:text-opacity-100"
                  >
                    <span className="sr-only">Twitter</span>
                    <Twitter className="h-6 w-6" />
                  </a>
                )}
                
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-opacity-70 hover:text-opacity-100"
                  >
                    <span className="sr-only">Instagram</span>
                    <Instagram className="h-6 w-6" />
                  </a>
                )}
                
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-opacity-70 hover:text-opacity-100"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <Linkedin className="h-6 w-6" />
                  </a>
                )}
                
                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-opacity-70 hover:text-opacity-100"
                  >
                    <span className="sr-only">GitHub</span>
                    <Github className="h-6 w-6" />
                  </a>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Navigation
                </h3>
                <ul className="mt-4 space-y-4">
                  {mainNavigation.slice(0, 3).map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-white text-opacity-70 hover:text-opacity-100"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Company
                </h3>
                <ul className="mt-4 space-y-4">
                  {mainNavigation.slice(3, 6).map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-white text-opacity-70 hover:text-opacity-100"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  {legalNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-white text-opacity-70 hover:text-opacity-100"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Contact
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a
                      href="mailto:info@lilyseo.com"
                      className="text-base text-white text-opacity-70 hover:text-opacity-100"
                    >
                      info@lilyseo.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+1234567890"
                      className="text-base text-white text-opacity-70 hover:text-opacity-100"
                    >
                      +1 (234) 567-890
                    </a>
                  </li>
                  <li className="text-base text-white text-opacity-70">
                    123 SEO Street, Digital City
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-white border-opacity-20 pt-8">
          <p className="text-base text-white text-opacity-70 text-center">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
} 