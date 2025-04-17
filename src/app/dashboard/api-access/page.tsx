export const dynamic = 'force-dynamic';

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Server,
  ShieldAlert,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Code,
  Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// API endpoints we'll document
const apiEndpoints = [
  {
    name: "Get Projects",
    method: "GET",
    endpoint: "/api/v1/projects",
    description: "Retrieves all projects associated with your account",
    responseExample: `{
  "projects": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Website",
      "domain": "example.com",
      "created_at": "2023-01-15T12:00:00Z"
    }
  ]
}`
  },
  {
    name: "Get Audits",
    method: "GET",
    endpoint: "/api/v1/projects/{project_id}/audits",
    description: "Retrieves all audits for a specific project",
    responseExample: `{
  "audits": [
    {
      "id": "987e6543-e21b-12d3-a456-426614174000",
      "project_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "completed",
      "score": 78,
      "created_at": "2023-02-20T14:30:00Z"
    }
  ]
}`
  },
  {
    name: "Create Audit",
    method: "POST",
    endpoint: "/api/v1/projects/{project_id}/audits",
    description: "Initiates a new audit for a specific project",
    requestExample: `{
  "crawl_options": {
    "max_urls": 100,
    "include_subdomains": true
  }
}`,
    responseExample: `{
  "audit_id": "456e7890-e21b-12d3-a456-426614174000",
  "status": "queued",
  "created_at": "2023-03-10T09:15:00Z"
}`
  },
  {
    name: "Get SEO Tasks",
    method: "GET",
    endpoint: "/api/v1/projects/{project_id}/tasks",
    description: "Retrieves all SEO tasks for a specific project",
    responseExample: `{
  "tasks": [
    {
      "id": "789e0123-e21b-12d3-a456-426614174000",
      "project_id": "123e4567-e89b-12d3-a456-426614174000",
      "audit_id": "987e6543-e21b-12d3-a456-426614174000",
      "title": "Fix missing meta descriptions",
      "priority": "high",
      "status": "open",
      "created_at": "2023-02-21T10:00:00Z"
    }
  ]
}`
  }
];

// Code examples in different languages
const codeExamples = {
  curl: `curl -X GET "https://api.lilyseo.com/api/v1/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  javascript: `// Using fetch API
fetch('https://api.lilyseo.com/api/v1/projects', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
  python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.lilyseo.com/api/v1/projects', headers=headers)
data = response.json()
print(data)`
};

export default function ApiAccessPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [hasPro, setHasPro] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCodeTab, setActiveCodeTab] = useState("curl");
  
  useEffect(() => {
    checkAccess();
    fetchApiKey();
  }, []);
  
  const checkAccess = async () => {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .single();
      
      if (error) {
        throw error;
      }
      
      // Only pro and enterprise users have API access
      const hasPro = 
        (profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise') &&
        (profile.subscription_status === 'active' || profile.subscription_status === 'trialing');
      
      setHasPro(hasPro);
    } catch (error) {
      console.error("Error checking access:", error);
    }
  };
  
  const fetchApiKey = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Get the user's API key from the database
      const { data, error } = await supabase
        .from("api_keys")
        .select("key_value, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setApiKey(data.key_value);
      }
    } catch (error) {
      console.error("Error fetching API key:", error);
      toast.error("Failed to load API key");
    } finally {
      setLoading(false);
    }
  };
  
  const generateApiKey = async () => {
    try {
      setGenerating(true);
      const supabase = createClient();
      
      // Call the create_api_key function
      const { data, error } = await supabase
        .rpc('create_api_key', {
          name: 'Default API Key',
          scopes: ['read', 'write'],
          expires_days: 365
        });
      
      if (error) {
        throw error;
      }
      
      setApiKey(data);
      setShowApiKey(true);
      toast.success("API key generated successfully");
      
    } catch (error) {
      console.error("Error generating API key:", error);
      toast.error("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };
  
  const regenerateApiKey = async () => {
    try {
      setRegenerating(true);
      const supabase = createClient();
      
      // First, get the current key ID
      const { data: keyData, error: keyError } = await supabase
        .from("api_keys")
        .select("id")
        .eq("key_value", apiKey)
        .single();
      
      if (keyError) {
        throw keyError;
      }
      
      // Call the regenerate_api_key function
      const { data, error } = await supabase
        .rpc('regenerate_api_key', {
          key_id: keyData.id
        });
      
      if (error) {
        throw error;
      }
      
      setApiKey(data);
      setShowApiKey(true);
      toast.success("API key regenerated successfully");
      
    } catch (error) {
      console.error("Error regenerating API key:", error);
      toast.error("Failed to regenerate API key");
    } finally {
      setRegenerating(false);
    }
  };
  
  const copyApiKey = () => {
    if (!apiKey) return;
    
    navigator.clipboard.writeText(apiKey)
      .then(() => toast.success("API key copied to clipboard"))
      .catch(err => {
        console.error("Failed to copy API key:", err);
        toast.error("Failed to copy API key");
      });
  };
  
  // Render API key display and management section
  const renderApiKeySection = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (hasPro) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Your API Key</CardTitle>
            <CardDescription>
              Use this key to authenticate requests to the LilySEO API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKey ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"} 
                      value={showApiKey ? apiKey : "•".repeat(20)}
                      readOnly
                      className="flex-1 font-mono"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="ml-2"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={copyApiKey}
                      className="ml-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Alert className="bg-blue-50">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Security Notice</AlertTitle>
                  <AlertDescription>
                    Your API key grants access to your LilySEO data. Keep it secure and never expose it in client-side code.
                  </AlertDescription>
                </Alert>
                <div>
                  <Button 
                    variant="destructive" 
                    onClick={regenerateApiKey} 
                    disabled={regenerating}
                    className="w-full"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate API Key
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Warning: Regenerating your API key will invalidate your existing key immediately.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-6">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No API Key Generated</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate an API key to start integrating with our API
                  </p>
                  <Button 
                    onClick={generateApiKey} 
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Server className="mr-2 h-4 w-4" />
                        Generate API Key
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardHeader>
            <CardTitle>API Access Restricted</CardTitle>
            <CardDescription>
              API access is only available for Pro and Enterprise plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Subscription required</AlertTitle>
              <AlertDescription>
                Upgrade your subscription to gain access to our API for integrating LilySEO with your applications and tools.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/dashboard/subscription"}>
              Upgrade Subscription
            </Button>
          </CardFooter>
        </Card>
      );
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <h1 className="text-3xl font-bold mr-3">API Access</h1>
          {hasPro && apiKey && (
            <Badge variant="outline" className={
              apiKey.includes("enterprise") ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
            }>
              {apiKey.includes("enterprise") ? "Enterprise" : "Pro"}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Access the LilySEO API to integrate our platform with your applications
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {renderApiKeySection()}
          
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our API allows you to access your LilySEO data programmatically. All API requests require authentication using your API key in the Authorization header.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="font-medium mb-2">Base URL</p>
                <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                  https://api.lilyseo.com
                </code>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="font-medium mb-2">Authentication</p>
                <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Pro Plan</span>
                  <span>1,000 requests per day</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Enterprise Plan</span>
                  <span>10,000 requests per day</span>
                </div>
                <Alert className="mt-4 bg-slate-50">
                  <AlertDescription>
                    All responses include rate limit headers: <code className="bg-slate-100 px-1 rounded text-xs font-mono">X-RateLimit-Limit</code>, <code className="bg-slate-100 px-1 rounded text-xs font-mono">X-RateLimit-Remaining</code>, and <code className="bg-slate-100 px-1 rounded text-xs font-mono">X-RateLimit-Reset</code>.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle>Available Endpoints</CardTitle>
              <CardDescription>
                Explore the endpoints available in the LilySEO API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={endpoint.name} className={index > 0 ? "pt-6 border-t" : ""}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-medium">{endpoint.name}</h3>
                      <Badge className={
                        endpoint.method === "GET" ? "bg-blue-100 text-blue-800" :
                        endpoint.method === "POST" ? "bg-green-100 text-green-800" :
                        endpoint.method === "PUT" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {endpoint.method}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{endpoint.description}</p>
                    <div className="bg-slate-50 p-3 rounded-md mb-3">
                      <code className="text-sm font-mono">{endpoint.endpoint}</code>
                    </div>
                    
                    {endpoint.requestExample && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Request Body Example:</p>
                        <pre className="bg-slate-100 p-3 rounded-md overflow-auto text-xs">
                          {endpoint.requestExample}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Response Example:</p>
                      <pre className="bg-slate-100 p-3 rounded-md overflow-auto text-xs">
                        {endpoint.responseExample}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Examples of how to use the LilySEO API in different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCodeTab} onValueChange={setActiveCodeTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="curl" className="flex items-center">
                    <Terminal className="mr-2 h-4 w-4" />
                    cURL
                  </TabsTrigger>
                  <TabsTrigger value="javascript" className="flex items-center">
                    <Code className="mr-2 h-4 w-4" />
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="python" className="flex items-center">
                    <Code className="mr-2 h-4 w-4" />
                    Python
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative">
                  <pre className="bg-slate-100 p-4 rounded-md overflow-auto text-sm font-mono">
                    {codeExamples[activeCodeTab as keyof typeof codeExamples]}
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(codeExamples[activeCodeTab as keyof typeof codeExamples]);
                      toast.success("Code copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <Alert className="mt-4 bg-slate-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Remember</AlertTitle>
                  <AlertDescription>
                    Replace <code className="bg-slate-100 px-1 rounded text-xs font-mono">YOUR_API_KEY</code> with your actual API key in the examples above.
                  </AlertDescription>
                </Alert>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 