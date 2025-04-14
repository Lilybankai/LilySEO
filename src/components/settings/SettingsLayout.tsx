import React, { useState } from 'react';
import Link from 'next/link';

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
    <div className="flex flex-col md:flex-row gap-8 p-4 md:p-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)} // Use the passed function
                className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1">
        {children} {/* Render children directly */}
      </main>
    </div>
  );
} 