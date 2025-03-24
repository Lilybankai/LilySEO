"use client";

import { useState, useEffect } from "react";
import { LifeBuoy, MessageSquare, Search, Loader2, ExternalLink, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define article interface
interface HelpArticle {
  id: number;
  title: string;
  description: string;
  category: string;
  url: string;
}

// Define category record interface
interface CategoryRecord {
  [key: string]: HelpArticle[];
}

// Support ticket categories
const ticketCategories = [
  { value: "account", label: "Account Issues" },
  { value: "billing", label: "Billing Questions" },
  { value: "technical", label: "Technical Support" },
  { value: "feature", label: "Feature Request" },
  { value: "bug", label: "Bug Report" },
  { value: "other", label: "Other" }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("help");
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  
  useEffect(() => {
    fetchHelpArticles();
  }, []);
  
  const fetchHelpArticles = async () => {
    try {
      setLoadingArticles(true);
      const supabase = createClient();
      
      // In a real implementation, this would fetch from a help_articles table
      // For now, we'll simulate with static data but structure it like it's from the database
      
      // Simulating a database fetch that would look like:
      // const { data, error } = await supabase.from('help_articles').select('*');
      
      const staticArticles: HelpArticle[] = [
        {
          id: 1,
          title: "Getting Started with LilySEO",
          description: "Learn the basics of using LilySEO for your SEO needs",
          category: "Getting Started",
          url: "/docs/getting-started"
        },
        {
          id: 2,
          title: "How to Run Your First SEO Audit",
          description: "Step-by-step guide to running your first website audit",
          category: "Audits",
          url: "/docs/first-audit"
        },
        {
          id: 3,
          title: "Understanding Your SEO Score",
          description: "Learn how to interpret your audit results and SEO score",
          category: "Audits",
          url: "/docs/seo-score"
        },
        {
          id: 4,
          title: "Managing Your SEO Tasks",
          description: "How to manage and prioritize SEO tasks effectively",
          category: "Tasks",
          url: "/docs/tasks"
        },
        {
          id: 5,
          title: "Setting Up Competitor Analysis",
          description: "Track and analyze your competitors' SEO performance",
          category: "Competitors",
          url: "/docs/competitors"
        },
        {
          id: 6,
          title: "Subscription Plan Options",
          description: "Compare different subscription plans and features",
          category: "Billing",
          url: "/docs/subscription"
        },
        {
          id: 7,
          title: "White Label Features",
          description: "How to use white label features for client reporting",
          category: "Enterprise",
          url: "/docs/white-label"
        },
        {
          id: 8,
          title: "Using the API",
          description: "Integrate LilySEO with your own applications",
          category: "Developers",
          url: "/docs/api"
        }
      ];
      
      setHelpArticles(staticArticles);
    } catch (error) {
      console.error("Error fetching help articles:", error);
      toast.error("Failed to load help articles");
    } finally {
      setLoadingArticles(false);
    }
  };
  
  // Filter help articles based on search query
  const filteredArticles = searchQuery
    ? helpArticles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : helpArticles;
  
  // Group articles by category
  const articlesByCategory: CategoryRecord = filteredArticles.reduce<CategoryRecord>((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {});
  
  // Handle support ticket submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!ticketCategory) {
      toast.error("Please select a category");
      return;
    }
    
    if (!ticketSubject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    
    if (!ticketMessage.trim() || ticketMessage.length < 10) {
      toast.error("Please enter a detailed message (at least 10 characters)");
      return;
    }
    
    try {
      setSubmitting(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a support ticket");
        return;
      }
      
      // Get user profile data for the ticket
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, subscription_tier")
        .eq("id", user.id)
        .single();
      
      // Create support ticket
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          category: ticketCategory,
          subject: ticketSubject,
          message: ticketMessage,
          status: "open",
          user_email: user.email,
          user_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : "User",
          user_tier: profile?.subscription_tier || "free"
        });
      
      if (error) {
        throw error;
      }
      
      // Create notification about the ticket
      await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: "Support Ticket Created",
          message: `Your support ticket "${ticketSubject}" has been submitted. We'll get back to you soon.`,
          is_read: false
        });
      
      // Reset form
      setTicketCategory("");
      setTicketSubject("");
      setTicketMessage("");
      
      toast.success("Support ticket submitted successfully");
      
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast.error("Failed to submit support ticket");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground mt-1">Get help and support for your LilySEO account</p>
        </div>
        
        <Button variant="default" onClick={() => window.open("https://docs.lilyseo.com", "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Full Documentation
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="help" className="flex items-center">
            <LifeBuoy className="mr-2 h-4 w-4" />
            Help Guides
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Support
          </TabsTrigger>
        </TabsList>
        
        {/* Help Guides Tab */}
        <TabsContent value="help" className="w-full">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search for help articles..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {loadingArticles ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchQuery && filteredArticles.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium">No articles found</p>
              <p className="text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {Object.keys(articlesByCategory).map(category => (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4">{category}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {articlesByCategory[category].map((article) => (
                      <Card key={article.id} className="h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {article.description}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" className="w-full justify-start" asChild>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Read More
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Contact Support Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Need help with something specific? Submit a ticket and our support team will get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={ticketCategory} 
                    onValueChange={setTicketCategory}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Provide details about your issue or question..."
                    rows={6}
                    required
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 