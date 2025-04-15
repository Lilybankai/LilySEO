import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define navigation items with unique keys
const navigation = [
  { key: 'account', name: 'Account' },
  { key: 'subscription', name: 'Subscription & Billing' },
  { key: 'whitelabel', name: 'White Label' },
  { key: 'notifications', name: 'Notifications' },
  { key: 'integrations', name: 'Integrations' },
  { key: 'team', name: 'Team Management' },
];

interface SettingsLayoutProps {
  activeSection: string; // Receive active section as prop
  setActiveSection: (key: string) => void; // Receive function to change section
  children: React.ReactNode; // Render children directly
}

export default function SettingsLayout({ 
  activeSection, 
  setActiveSection, 
  children 
}: SettingsLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8"> {/* Adjusted layout and gap */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6"> {/* Responsive grid */}
          {navigation.map((item) => (
            <TabsTrigger key={item.key} value={item.key}>
              {item.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {/* Removed the aside element */}
      <main className="flex-1">
        {children} {/* Render children directly */}
      </main>
    </div>
  );
} 