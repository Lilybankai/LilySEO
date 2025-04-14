"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Define the notification types and their user-friendly labels
const notificationTypes = {
  audit_completion: "Audit Completion",
  team_invitation: "Team Invitations",
  weekly_summary: "Weekly Summary Report",
  monthly_summary: "Monthly Summary Report",
  // Add more types here as needed
};

type NotificationTypeKey = keyof typeof notificationTypes;

// Structure for storing settings state
interface NotificationSettingsState {
  [key: string]: {
    email_enabled: boolean;
    in_app_enabled: boolean;
  };
}

// Structure for data fetched/saved to Supabase
interface DbNotificationSetting {
  id?: string; // Optional on insert
  user_id: string;
  notification_type: NotificationTypeKey;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export function NotificationSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [settings, setSettings] = useState<NotificationSettingsState>({});

  // Initialize settings with defaults
  const initializeSettings = useCallback(() => {
    const initialSettings: NotificationSettingsState = {};
    Object.keys(notificationTypes).forEach((key) => {
      initialSettings[key] = { email_enabled: true, in_app_enabled: true }; // Default to enabled
    });
    setSettings(initialSettings);
  }, []);

  // Load user settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        initializeSettings(); // Start with defaults
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUserId(user.id);

        const { data: dbSettings, error } = await supabase
          .from("user_notification_settings")
          .select("notification_type, email_enabled, in_app_enabled")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching notification settings:", error);
          toast.error("Failed to load notification settings");
          // Keep default settings
        } else if (dbSettings) {
          // Merge fetched settings with defaults
          setSettings((prevSettings) => {
            const updatedSettings = { ...prevSettings };
            dbSettings.forEach((setting) => {
              if (updatedSettings[setting.notification_type]) {
                updatedSettings[setting.notification_type] = {
                  email_enabled: setting.email_enabled,
                  in_app_enabled: setting.in_app_enabled,
                };
              }
            });
            return updatedSettings;
          });
        }
      } catch (error) {
        console.error("Error in fetchSettings:", error);
        toast.error("An unexpected error occurred while loading settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router, initializeSettings]);

  // Handle toggle change
  const handleToggleChange = (type: NotificationTypeKey, channel: 'email' | 'in_app', checked: boolean) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [type]: {
        ...prevSettings[type],
        [`${channel}_enabled`]: checked,
      },
    }));
  };

  // Handle saving settings
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const upsertData: DbNotificationSetting[] = Object.entries(settings).map(([type, prefs]) => ({
        user_id: userId,
        notification_type: type as NotificationTypeKey,
        email_enabled: prefs.email_enabled,
        in_app_enabled: prefs.in_app_enabled,
      }));

      // Upsert handles both inserting new settings and updating existing ones based on the unique constraint (user_id, notification_type)
      const { error } = await supabase
        .from("user_notification_settings")
        .upsert(upsertData, { onConflict: 'user_id, notification_type' });

      if (error) {
        console.error("Error saving notification settings:", error);
        throw error; // Let the catch block handle toast
      }

      toast.success("Notification settings saved successfully!");

    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save notification settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose how you want to be notified about different activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(notificationTypes).map(([key, label]) => (
          <div key={key} className="p-4 border rounded-md space-y-3">
            <Label className="text-base font-medium">{label}</Label>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <p className="text-sm text-muted-foreground">Receive email notifications</p>
              <Switch
                checked={settings[key]?.email_enabled ?? true}
                onCheckedChange={(checked) => handleToggleChange(key as NotificationTypeKey, 'email', checked)}
                disabled={saving}
                aria-label={`${label} email notifications`}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
              <Switch
                checked={settings[key]?.in_app_enabled ?? true}
                onCheckedChange={(checked) => handleToggleChange(key as NotificationTypeKey, 'in_app', checked)}
                disabled={saving}
                aria-label={`${label} in-app notifications`}
              />
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveChanges} 
          disabled={saving || loading}
          className="ml-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Notification Settings"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 