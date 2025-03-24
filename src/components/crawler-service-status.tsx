"use client";

import { useEffect, useState } from "react";
import { isCrawlerServiceAvailable } from "@/lib/crawler-service-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function CrawlerServiceStatus() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkServiceStatus = async () => {
      setIsLoading(true);
      try {
        const available = await isCrawlerServiceAvailable();
        setIsAvailable(available);
      } catch (error) {
        console.error("Error checking crawler service:", error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkServiceStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkServiceStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Alert className="bg-gray-100 border-gray-200">
        <AlertCircle className="h-4 w-4 text-gray-500" />
        <AlertTitle>Checking crawler service...</AlertTitle>
        <AlertDescription>
          Verifying connection to the SEO crawler service.
        </AlertDescription>
      </Alert>
    );
  }

  if (isAvailable === false) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Crawler Service Unavailable</AlertTitle>
        <AlertDescription>
          The SEO crawler service is currently unavailable. Some features may not work properly.
        </AlertDescription>
      </Alert>
    );
  }

  if (isAvailable === true) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Crawler Service Connected</AlertTitle>
        <AlertDescription>
          The SEO crawler service is available and ready to process audits.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
} 