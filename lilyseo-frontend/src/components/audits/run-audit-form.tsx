import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RunAuditFormProps {
  projectId: string;
  projectUrl?: string;
}

export function RunAuditForm({ projectId, projectUrl = "" }: RunAuditFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(projectUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError("URL is required");
      return;
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          projectId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to run audit");
      }
      
      toast.success("Audit completed successfully");
      router.push(`/dashboard/projects/${projectId}/audits/${data.data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while running the audit");
      toast.error(err.message || "An error occurred while running the audit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Run SEO Audit</CardTitle>
        <CardDescription>
          Analyze your website for SEO issues and get recommendations for improvement.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Running Audit..." : "Run Audit"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 