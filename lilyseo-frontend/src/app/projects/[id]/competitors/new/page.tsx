"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AddCompetitorModal } from "@/components/competitors/add-competitor-modal";

export default function AddCompetitorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  
  const [open, setOpen] = useState(true);
  
  // If dialog is closed, go back to competitors page
  useEffect(() => {
    if (!open) {
      router.push(`/projects/${projectId}/competitors`);
    }
  }, [open, router, projectId]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.push(`/projects/${projectId}/competitors`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to competitors
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Competitor</CardTitle>
          <CardDescription>
            Add a competitor website to analyze and compare against your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Use the form below to add a new competitor to your project.
          </p>
          
          <AddCompetitorModal
            projectId={projectId}
            open={open}
            onOpenChange={setOpen}
            onSuccess={() => router.push(`/projects/${projectId}/competitors`)}
          />
        </CardContent>
      </Card>
    </div>
  );
} 