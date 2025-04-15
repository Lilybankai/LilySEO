import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  logoUrl?: string;
  logoAlt?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  showAuth?: boolean;
  navigation?: Array<{
    name: string;
    href: string;
    current: boolean;
  }>;
}

export function Header({
  logoUrl = "/logo.svg",
  logoAlt = "LilySEO",
  primaryColor = "#4f46e5",
  secondaryColor = "#ffffff",
  companyName = "LilySEO",
  showAuth = true,
  navigation = [
    { name: "Home", href: "/", current: true },
    { name: "Features", href: "/features", current: false },
    { name: "Pricing", href: "/pricing", current: false },
    { name: "Blog", href: "/blog", current: false },
    { name: "Contact", href: "/contact", current: false },
  ],
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };
  
  // Generate styles based on props
  const headerStyle = {
    backgroundColor: primaryColor,
    color: secondaryColor,
  };
  
  const buttonStyle = {
    backgroundColor: secondaryColor,
    color: primaryColor,
  };
  
  return (
    <header className="relative" style={headerStyle}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
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
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      item.current
                        ? "bg-opacity-20 bg-white text-white"
                        : "text-white hover:bg-opacity-10 hover:bg-white"
                    }`}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {showAuth && (
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Button
                  variant="outline"
                  className="mr-4"
                  style={buttonStyle}
                  onClick={() => router.push("/login")}
                >
                  Log in
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  style={{
                    backgroundColor: secondaryColor,
                    color: primaryColor,
                  }}
                >
                  Sign up
                </Button>
              </div>
            </div>
          )}
          
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-opacity-10 hover:bg-white focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  item.current
                    ? "bg-opacity-20 bg-white text-white"
                    : "text-white hover:bg-opacity-10 hover:bg-white"
                }`}
                aria-current={item.current ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {showAuth && (
            <div className="border-t border-white border-opacity-20 pb-3 pt-4">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    style={buttonStyle}
                    onClick={() => router.push("/login")}
                  >
                    Log in
                  </Button>
                </div>
                <div className="ml-3">
                  <Button
                    className="w-full"
                    style={{
                      backgroundColor: secondaryColor,
                      color: primaryColor,
                    }}
                    onClick={() => router.push("/signup")}
                  >
                    Sign up
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
} 