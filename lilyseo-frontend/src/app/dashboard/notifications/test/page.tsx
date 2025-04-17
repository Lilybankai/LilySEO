"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { notifyAuditComplete, notifyNewTodos, notifyRankingChanges, notifySubscriptionChange } from "@/lib/notification-utils";

export default function TestNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  
  const createCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to create a notification");
        return;
      }
      
      if (!title || !message) {
        setError("Title and message are required");
        return;
      }
      
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, message }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create notification");
      }
      
      setSuccess(true);
      setTitle("");
      setMessage("");
      
      // Force a refresh of the parent page to update notification count
      router.refresh();
      
    } catch (error) {
      console.error("Error creating notification:", error);
      setError(error instanceof Error ? error.message : "Failed to create notification");
    } finally {
      setLoading(false);
    }
  };
  
  const generatePresetNotification = async (type: string) => {
    setLoading(true);
    setSuccess(false);
    setError("");
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to create a notification");
        return;
      }
      
      let success = false;
      
      switch (type) {
        case "audit":
          success = await notifyAuditComplete(user.id, "Example Project", "abc123");
          break;
        case "todos":
          success = await notifyNewTodos(user.id, "Example Project", 5);
          break;
        case "rankings":
          success = await notifyRankingChanges(user.id, "Example Project", 3, 1);
          break;
        case "subscription":
          success = await notifySubscriptionChange(user.id, "Pro");
          break;
        default:
          setError("Invalid notification type");
          return;
      }
      
      if (success) {
        setSuccess(true);
        // Force a refresh of the parent page to update notification count
        router.refresh();
      } else {
        setError("Failed to create notification");
      }
      
    } catch (error) {
      console.error("Error creating notification:", error);
      setError(error instanceof Error ? error.message : "Failed to create notification");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Test Notifications</h1>
      <p className="text-muted-foreground mb-8">Use this page to generate test notifications for development and testing purposes.</p>
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Notification created successfully!</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Notification</CardTitle>
            <CardDescription>Create a notification with custom title and message</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCustomNotification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Notification title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Notification message"
                  rows={3}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Preset Notifications</CardTitle>
            <CardDescription>Generate common notification types with preset content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => generatePresetNotification("audit")}
                disabled={loading}
              >
                Audit Completion
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => generatePresetNotification("todos")}
                disabled={loading}
              >
                New SEO Tasks
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => generatePresetNotification("rankings")}
                disabled={loading}
              >
                Ranking Changes
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => generatePresetNotification("subscription")}
                disabled={loading}
              >
                Subscription Change
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 