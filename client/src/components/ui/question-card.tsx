import { Question } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionCardProps {
  question: Question;
  showAdminControls?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function QuestionCard({ question, showAdminControls, onApprove, onReject }: QuestionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/questions/${id}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like question",
        variant: "destructive"
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/questions/${id}/status`, { status: "approved" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Question approved"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/questions/${id}/status`, { status: "rejected" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Question rejected"
      });
    }
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const questionDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - questionDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="question-card bg-[var(--deep-navy)]/70 backdrop-blur-sm rounded-xl p-6 border border-[var(--cyan-accent)]/20 hover:border-[var(--cyan-accent)]/40 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--cyan-accent)]/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-[var(--cyan-accent)]" />
          </div>
          <div>
            <div className="font-medium">{question.author}</div>
            <div className="text-xs text-gray-400">{formatTimeAgo(question.createdAt || new Date())}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(question.status || "pending")}
          {!showAdminControls && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeMutation.mutate(question.id)}
                disabled={likeMutation.isPending}
                className="text-gray-400 hover:text-[var(--cyan-accent)] p-1"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <span className="text-sm">{question.likes || 0}</span>
            </>
          )}
        </div>
      </div>
      
      <p className="text-gray-100 mb-4">{question.content}</p>
      
      {showAdminControls && question.status === "pending" && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => approveMutation.mutate(question.id)}
            disabled={approveMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => rejectMutation.mutate(question.id)}
            disabled={rejectMutation.isPending}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
