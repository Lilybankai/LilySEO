"use client";

import SettingsLayout from '@/components/settings/SettingsLayout';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { WhiteLabelSettings } from '@/components/settings/WhiteLabelSettings';
import { SubscriptionSettings } from '@/components/settings/SubscriptionSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { TeamManagementSettings } from '@/components/settings/TeamManagementSettings';
import React, { useState } from 'react';

// Placeholder content for now
function AccountSettingsPlaceholder() {
  return <div>Account Settings Content Here...</div>;
}

export default function SettingsPage() {
  // Manage active section state here
  const [activeSection, setActiveSection] = useState<string>('account');

  // Function to render the correct component based on state
  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />;
      case 'subscription':
        // Pass setActiveSection down to SubscriptionSettings
        return <SubscriptionSettings setActiveSection={setActiveSection} />;
      case 'whitelabel':
        return <WhiteLabelSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'integrations':
        return <IntegrationSettings />;
      case 'team':
        // Pass setActiveSection down to TeamManagementSettings
        return <TeamManagementSettings setActiveSection={setActiveSection} />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    // Pass state and setter function to SettingsLayout
    <SettingsLayout 
      activeSection={activeSection} 
      setActiveSection={setActiveSection}
    >
      {renderSection()} {/* Render the active component */}
    </SettingsLayout>
  );
} 