"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from 'date-fns'; // For relative time formatting

// Define the structure of a comment
interface Comment {
  id: string;
  created_at: string;
  content: string;
  user: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    subscription_tier: string;
  };
}

// Define the props for the component
interface FeatureRequestCommentsProps {
  requestId: string;
  currentUser: { // Pass current user details for submitting comments
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    subscription_tier?: string | null;
  } | null;
  onCommentAdded: () => void; // Callback to update parent's comment count
}

export default function FeatureRequestComments({ requestId, currentUser, onCommentAdded }: FeatureRequestCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const supabase = createClient();

  // Function to fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      // First, get all comments
      const { data: commentData, error: commentError } = await supabase
        .from('feature_request_comments')
        .select('*')
        .eq('feature_request_id', requestId)
        .eq('is_internal', false) // Only public comments
        .order('created_at', { ascending: true }); // Show oldest first

      if (commentError) {
        console.error("Error fetching comments:", commentError);
        toast.error("Failed to load comments.");
        throw commentError;
      }

      // No comments? Return early
      if (!commentData || commentData.length === 0) {
        setComments([]);
        setLoadingComments(false);
        return;
      }

      // Extract all user IDs to get their profiles
      const userIds = commentData.map(comment => comment.user_id);
      
      // Fetch all relevant profiles in one go
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
        // Continue with partial data
      }

      // Create a lookup map for profiles by user ID
      const profilesMap = (profilesData || []).reduce((acc: Record<string, any>, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine comments with their respective profiles
      const formattedComments = commentData.map((comment: any) => {
        const userProfile = profilesMap[comment.user_id] || null;
        
        return {
          id: comment.id,
          created_at: comment.created_at,
          content: comment.content,
          user: userProfile || {
            id: comment.user_id || 'unknown',
            email: 'Unknown User',
            subscription_tier: 'free',
            first_name: null,
            last_name: null,
            avatar_url: null,
          }
        };
      });

      setComments(formattedComments);

    } catch (err) {
      // Error already handled, toast shown
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch comments when the component mounts or requestId changes
  useEffect(() => {
    if (requestId) {
      fetchComments();
    }
  }, [requestId]);

  // Function to handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.warning("Comment cannot be empty.");
      return;
    }
    if (!currentUser) {
      toast.error("You must be logged in to comment.");
      return;
    }

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('feature_request_comments')
        .insert({
          feature_request_id: requestId,
          user_id: currentUser.id,
          content: newComment.trim(),
          is_internal: false // Always public for users
        });

      if (error) {
        console.error("Error submitting comment:", error);
        toast.error(`Failed to submit comment: ${error.message}`);
        throw error;
      }

      toast.success("Comment added!");
      setNewComment(""); // Clear textarea
      fetchComments(); // Refresh comments list
      onCommentAdded(); // Notify parent to potentially update count

    } catch (err) {
       // Error already handled
    } finally {
      setSubmittingComment(false);
    }
  };

  // Function to get user display name
  const getUserDisplayName = (user: Comment['user']) => {
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.email || 'Anonymous';
  };

  // Function to get fallback initials
  const getAvatarFallback = (user: Comment['user']) => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return first + last || user.email?.[0]?.toUpperCase() || '?';
  }

  return (
    <div className="px-6 pb-4 pt-4 border-t mt-4 space-y-4">
      <h4 className="text-sm font-semibold mb-2">Comments</h4>
      
      {/* Comments List */}
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        {loadingComments ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={comment.user.avatar_url || ""} alt={getUserDisplayName(comment.user)} />
                <AvatarFallback>{getAvatarFallback(comment.user)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm bg-gray-50 rounded-md p-3">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-medium text-gray-800">{getUserDisplayName(comment.user)}</span>
                   <Badge variant="outline" className={
                      comment.user.subscription_tier === "enterprise" ? "border-purple-300 bg-purple-50 text-purple-800 text-xs px-1.5 py-0.5" :
                      comment.user.subscription_tier === "pro" ? "border-blue-300 bg-blue-50 text-blue-800 text-xs px-1.5 py-0.5" :
                      "border-gray-300 bg-gray-50 text-gray-600 text-xs px-1.5 py-0.5"
                   }>
                     {comment.user.subscription_tier?.charAt(0).toUpperCase() + comment.user.subscription_tier?.slice(1)}
                   </Badge>
                   <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                   </span>
                 </div>
                 <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {currentUser && ( // Only show form if user is logged in
        <div className="flex items-start gap-3 pt-4 border-t">
           <Avatar className="h-8 w-8 mt-1">
             <AvatarImage src={currentUser.avatar_url || ""} alt={currentUser.first_name || currentUser.email || ""} />
             <AvatarFallback>
                {currentUser.first_name?.[0] || currentUser.email?.[0]?.toUpperCase() || '?'}
                {currentUser.last_name?.[0] || ''}
             </AvatarFallback>
           </Avatar>
           <div className="flex-1">
            <Textarea
              placeholder="Add your comment..."
              rows={2}
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              className="mb-2 text-sm"
              disabled={submittingComment}
            />
            <Button 
              size="sm" 
              onClick={handleSubmitComment} 
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Post Comment
            </Button>
           </div>
        </div>
      )}
    </div>
  );
} 