"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  Tag, 
  Clock, 
  CheckCircle2, 
  Lightbulb, 
  Filter,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interfaces for type safety
interface ChangelogItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "feature" | "improvement" | "bugfix";
  version?: string;
}

interface Comment {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    subscription_tier: string;
  };
}

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  status: "requested" | "planned" | "in_progress" | "completed" | "rejected";
  upvotes: number;
  comments_count: number;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    subscription_tier: string;
  };
  has_user_upvoted?: boolean;
  comments?: Comment[];
}

export default function ChangelogPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(tabParam === 'features' ? 'features' : 'changelog');
  
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [changelogItems, setChangelogItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to view this page");
        return;
      }
      
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setUserProfile(profile);
      
      // Fetch changelog items
      const { data: changelog, error: changelogError } = await supabase
        .from("changelog_items")
        .select("*")
        .order("release_date", { ascending: false });
      
      if (changelogError) {
        throw changelogError;
      }
      
      // Format changelog items to match our interface
      const formattedChangelog = changelog.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.release_date,
        type: item.type.toLowerCase(),
        version: item.version
      }));
      
      setChangelogItems(formattedChangelog);
      
      // Fetch feature requests - UPDATED to use feature_requests_with_users view
      const { data: features, error: featuresError } = await supabase
        .from("feature_requests_with_users")
        .select("*")
        .eq("is_public", true)
        .order("upvotes", { ascending: false });
      
      if (featuresError) {
        throw featuresError;
      }
      
      // Check which feature requests the user has voted for - UPDATED to use get_user_votes function
      const { data: userVotes, error: votesError } = await supabase
        .rpc('get_user_votes');
      
      if (votesError) {
        throw votesError;
      }
      
      // Add the has_user_upvoted property to each feature request
      const userVotedIds = userVotes?.map((vote: { feature_request_id: string }) => vote.feature_request_id) || [];
      
      // Format the results to match our interface
      const formattedFeatures = features.map((feature: any) => ({
        id: feature.id,
        title: feature.title,
        description: feature.description,
        created_at: feature.created_at,
        user_id: feature.user_id,
        status: feature.status.toLowerCase(),
        upvotes: feature.upvotes,
        comments_count: feature.comments_count || 0, // Use fetched count, default to 0 if null/undefined
        user: {
          id: feature.user_id,
          email: feature.email,
          first_name: feature.first_name,
          last_name: feature.last_name,
          avatar_url: feature.avatar_url,
          subscription_tier: feature.subscription_tier
        },
        has_user_upvoted: userVotedIds.includes(feature.id)
      }));
      
      setFeatureRequests(formattedFeatures);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVote = async (requestId: string, hasVoted: boolean | undefined) => {
    try {
      setVotingId(requestId);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to vote");
        return;
      }
      
      // Fix the RPC call syntax
      const { error: voteError, data: voteResult } = await supabase
        .rpc('vote_for_feature_request', {
          p_feature_request_id: requestId,
        });
      
      if (voteError) {
        console.error("Error voting:", voteError);
        throw voteError;
      }
      
      // Toggle vote state in UI - data will be true if vote was added, false if removed
      setFeatureRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                upvotes: voteResult ? request.upvotes + 1 : request.upvotes - 1,
                has_user_upvoted: voteResult
              } 
            : request
        )
      );
      
      toast.success(voteResult ? "Vote added" : "Vote removed");
    } catch (error) {
      console.error("Error voting:", error);
      // Check if error is a PostgrestError and has a message
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : 'An unknown error occurred while voting.';
      toast({
        title: "Error Voting",
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setVotingId(null);
    }
  };
  
  const handleSubmitFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!featureTitle.trim()) {
      toast.error("Please enter a title for your feature request");
      return;
    }
    
    if (!featureDescription.trim() || featureDescription.length < 10) {
      toast.error("Please enter a detailed description (at least 10 characters)");
      return;
    }
    
    try {
      setSubmitting(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a feature request");
        return;
      }
      
      // Insert the feature request into the database
      const { data: newFeatureRequest, error } = await supabase
        .from("feature_requests")
        .insert({
          title: featureTitle,
          description: featureDescription,
          user_id: user.id,
          status: 'Submitted', // Use the enum value from the database
          is_public: true,
          upvotes: 0 // Start with 0, the vote will be added by RPC
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error inserting feature request:", error);
        throw error;
      }
      
      // Add the creator's vote using our new RPC function
      const { data: voteResult, error: voteError } = await supabase
        .rpc('vote_for_feature_request', { feature_request_id: newFeatureRequest.id });
      
      if (voteError) {
        console.error("Error voting for feature request:", voteError);
        // Don't throw here, as the feature request was still created
      }
      
      // Create a formatted object to add to the state
      const formattedRequest: FeatureRequest = {
        id: newFeatureRequest.id,
        title: newFeatureRequest.title,
        description: newFeatureRequest.description,
        created_at: newFeatureRequest.created_at,
        user_id: newFeatureRequest.user_id,
        status: newFeatureRequest.status.toLowerCase(),
        upvotes: voteError ? 0 : 1, // If voting failed, show 0, otherwise 1
        comments_count: 0,
        user: {
          id: user.id,
          email: user?.email || "",
          first_name: userProfile?.first_name,
          last_name: userProfile?.last_name,
          avatar_url: userProfile?.avatar_url,
          subscription_tier: userProfile?.subscription_tier || "free"
        },
        has_user_upvoted: !voteError // Should be true unless vote failed
      };
      
      // Add the new request to the state
      setFeatureRequests(prev => [formattedRequest, ...prev]);
      
      // Reset form
      setFeatureTitle("");
      setFeatureDescription("");
      
      toast.success("Feature request submitted successfully");
      
    } catch (error) {
      console.error("Error submitting feature request:", error);
      toast.error("Failed to submit feature request");
    } finally {
      setSubmitting(false);
    }
  };
  
  const getFilteredFeatureRequests = () => {
    let filtered = [...featureRequests];
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(request => request.status === filterStatus);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.upvotes - a.upvotes;
      }
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="bg-slate-100">Requested</Badge>;
      case "planned":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planned</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Not Planned</Badge>;
      default:
        return null;
    }
  };
  
  const fetchComments = async (requestId: string) => {
    try {
      setLoadingComments(true);
      const supabase = createClient();
      
      // First, check if we already have comments for this request
      const existingRequest = featureRequests.find(req => req.id === requestId);
      if (existingRequest?.comments) {
        // Comments already loaded
        return;
      }
      
      // Fetch comments for this request
      const { data: comments, error } = await supabase
        .from("feature_request_comments")
        .select(`
          id, 
          created_at, 
          content, 
          user_id, 
          is_internal,
          profiles:user_id (
            email,
            first_name,
            last_name,
            avatar_url,
            subscription_tier
          )
        `)
        .eq("feature_request_id", requestId)
        .eq("is_internal", false) // Only show public comments
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
      
      // Format the comments and add them to the request
      const formattedComments = comments.map((comment: any) => ({
        id: comment.id,
        created_at: comment.created_at,
        user_id: comment.user_id,
        content: comment.content,
        is_internal: comment.is_internal,
        user: comment.profiles
      }));
      
      // Update the feature request with comments AND count
      setFeatureRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, comments: formattedComments, comments_count: formattedComments.length } // Update count here
            : request
        )
      );
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleAddComment = async (requestId: string) => {
    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    
    try {
      setSubmitting(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to comment");
        return;
      }
      
      // Insert the comment
      const { data: newComment, error } = await supabase
        .from("feature_request_comments")
        .insert({
          feature_request_id: requestId,
          user_id: user.id,
          content: commentText,
          is_internal: false // Always false for user comments
        })
        .select(`
          id, 
          created_at, 
          content, 
          user_id, 
          is_internal,
          profiles:user_id (
            email,
            first_name,
            last_name,
            avatar_url,
            subscription_tier
          )
        `)
        .single();
      
      if (error) {
        console.error("Error adding comment:", error);
        throw error;
      }
      
      // Format the new comment
      const formattedComment = {
        id: newComment.id,
        created_at: newComment.created_at,
        user_id: newComment.user_id,
        content: newComment.content,
        is_internal: newComment.is_internal,
        user: newComment.profiles
      };
      
      // Add the comment to the request
      setFeatureRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                comments: [...(request.comments || []), formattedComment],
                comments_count: (request.comments_count || 0) + 1
              } 
            : request
        )
      );
      
      // Reset the comment text
      setCommentText("");
      toast.success("Comment added");
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };
  
  const toggleComments = async (requestId: string) => {
    if (expandedCommentId === requestId) {
      // Close the comments section
      setExpandedCommentId(null);
    } else {
      // Open the comments section
      setExpandedCommentId(requestId);
      // Fetch comments if not already loaded
      await fetchComments(requestId);
    }
  };
  
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Updates & Requests</h1>
        <p className="text-muted-foreground mt-1">
          Stay up to date with the latest features and request new ones
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="changelog" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Changelog
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center">
            <Lightbulb className="mr-2 h-4 w-4" />
            Feature Requests
          </TabsTrigger>
        </TabsList>
        
        {/* Changelog Tab */}
        <TabsContent value="changelog" className="space-y-6">
          {changelogItems.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    {item.version && (
                      <div className="flex gap-2 items-center mt-1 text-sm text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        <span>v{item.version}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      item.type === "feature" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                      item.type === "improvement" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                      "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }>
                      {item.type === "feature" ? "New Feature" : 
                       item.type === "improvement" ? "Improvement" : 
                       "Bug Fix"}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Feature Requests Tab */}
        <TabsContent value="features">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Request a New Feature</CardTitle>
                  <CardDescription>
                    Submit your ideas for new features or improvements. Popular requests are more likely to be implemented.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitFeature} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Feature title"
                        value={featureTitle}
                        onChange={(e) => setFeatureTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Describe your feature request in detail..."
                        rows={4}
                        value={featureDescription}
                        onChange={(e) => setFeatureDescription(e.target.value)}
                        required
                      />
                    </div>
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
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Submit Feature Request
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Filter & Sort</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Requests</SelectItem>
                        <SelectItem value="requested">Requested</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={(value: "newest" | "popular") => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="popular">Most Upvoted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {getFilteredFeatureRequests().map(request => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-start">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`rounded-full ${request.has_user_upvoted ? 'text-blue-600 hover:text-blue-700' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => handleVote(request.id, request.has_user_upvoted)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="ml-1">{request.upvotes}</span>
                        </Button>
                        <div>
                          <CardTitle className="text-lg">{request.title}</CardTitle>
                          <div className="flex flex-wrap gap-2 mt-1 items-center">
                            {getStatusBadge(request.status)}
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          request.user.subscription_tier === "enterprise" ? "bg-purple-100 text-purple-800" :
                          request.user.subscription_tier === "pro" ? "bg-blue-100 text-blue-800" :
                          "bg-slate-100"
                        }>
                          {request.user.subscription_tier.charAt(0).toUpperCase() + request.user.subscription_tier.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{request.description}</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={request.user.avatar_url || ""} alt={`${request.user.first_name} ${request.user.last_name}`} />
                        <AvatarFallback>
                          {request.user.first_name?.[0] || request.user.email[0].toUpperCase()}
                          {request.user.last_name?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {request.user.first_name && request.user.last_name
                          ? `${request.user.first_name} ${request.user.last_name}`
                          : request.user.email}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col w-full pt-0 gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground self-start"
                      onClick={() => toggleComments(request.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {request.comments_count} {request.comments_count === 1 ? "Comment" : "Comments"}
                    </Button>
                    
                    {expandedCommentId === request.id && (
                      <div className="w-full border-t pt-3 mt-1">
                        {loadingComments ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            {request.comments && request.comments.length > 0 ? (
                              <div className="space-y-4 mb-4">
                                {request.comments.map(comment => (
                                  <div key={comment.id} className="flex gap-2">
                                    <Avatar className="h-6 w-6 mt-0.5">
                                      <AvatarImage 
                                        src={comment.user.avatar_url || ""} 
                                        alt={`${comment.user.first_name} ${comment.user.last_name}`} 
                                      />
                                      <AvatarFallback>
                                        {comment.user.first_name?.[0] || comment.user.email[0].toUpperCase()}
                                        {comment.user.last_name?.[0] || ""}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {comment.user.first_name && comment.user.last_name
                                            ? `${comment.user.first_name} ${comment.user.last_name}`
                                            : comment.user.email}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm mt-1">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                              </div>
                            )}
                            
                            {/* Comment form */}
                            <div className="flex gap-2 mt-2">
                              <Textarea 
                                placeholder="Add a comment..." 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="flex-1 h-20 resize-none"
                              />
                              <Button 
                                onClick={() => handleAddComment(request.id)}
                                disabled={submitting || !commentText.trim()}
                                className="self-start"
                              >
                                {submitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : "Post"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {getFilteredFeatureRequests().length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg font-medium">No feature requests found</p>
                  <p className="text-muted-foreground mt-1">Try changing the filters or submit a new request</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 