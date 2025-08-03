import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, ArrowLeft, Settings, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Question, EventSettings } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eventName, setEventName] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const { isConnected } = useWebSocket();

  // Fetch current event settings
  const { data: settings, isLoading: settingsLoading } = useQuery<EventSettings>({
    queryKey: ['/api/settings']
  });

  // Fetch all questions for management
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  // Update event settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: { eventName?: string; autoApproveQuestions?: boolean }) => 
      apiRequest('/api/settings', 'PATCH', settings),
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Event settings have been successfully changed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete individual question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => apiRequest(`/api/questions/${questionId}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete all questions mutation
  const deleteAllQuestionsMutation = useMutation({
    mutationFn: () => apiRequest('/api/questions', 'DELETE'),
    onSuccess: () => {
      toast({
        title: "All questions deleted",
        description: "All questions have been successfully cleared.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete all questions. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateEventName = () => {
    if (eventName.trim() && eventName !== settings?.eventName) {
      updateSettingsMutation.mutate({ eventName: eventName.trim() });
    }
  };

  const handleToggleAutoApprove = () => {
    const newValue = !autoApprove;
    setAutoApprove(newValue);
    updateSettingsMutation.mutate({ autoApproveQuestions: newValue });
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestionMutation.mutate(questionId);
  };

  const handleDeleteAllQuestions = () => {
    deleteAllQuestionsMutation.mutate();
  };

  // Set initial values when settings load
  useEffect(() => {
    if (settings && eventName === "") {
      setEventName(settings.eventName);
      setAutoApprove(settings.autoApproveQuestions);
    }
  }, [settings, eventName]);

  if (settingsLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-white">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Admin Settings</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Event Name Settings */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Event Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="bg-white/5 border-white/30 text-white placeholder:text-white/60"
                  />
                  <Button 
                    onClick={handleUpdateEventName}
                    disabled={updateSettingsMutation.isPending || !eventName.trim() || eventName === settings?.eventName}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
                <p className="text-sm text-white/60">
                  This name will appear on all screens and is used for future events.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoApprove">Auto-approve Questions</Label>
                    <p className="text-sm text-white/60">
                      When enabled, new questions are automatically approved. When disabled, questions require manual approval.
                    </p>
                  </div>
                  <Switch
                    id="autoApprove"
                    checked={autoApprove}
                    onCheckedChange={handleToggleAutoApprove}
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Management */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Question Management
                <div className="text-sm font-normal text-white/60">
                  {questions.length} total questions
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delete All Questions */}
              <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div>
                  <h3 className="font-medium text-red-200">Clear All Questions</h3>
                  <p className="text-sm text-red-300/80">
                    Permanently delete all questions from this event session.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={questions.length === 0 || deleteAllQuestionsMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteAllQuestionsMutation.isPending ? "Deleting..." : "Clear All"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-800 text-white border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Delete All Questions?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-300">
                        This action cannot be undone. All {questions.length} questions will be permanently deleted from this event session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAllQuestions}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Separator className="bg-white/20" />

              {/* Individual Questions */}
              <div className="space-y-2">
                <h3 className="font-medium">Individual Questions</h3>
                {questions.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No questions to manage</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {questions.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-start justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {question.content}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-white/60">
                            <span>By: {question.author || "Anonymous"}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              question.status === "approved" 
                                ? "bg-green-500/20 text-green-200" 
                                : question.status === "rejected"
                                ? "bg-red-500/20 text-red-200"
                                : "bg-yellow-500/20 text-yellow-200"
                            }`}>
                              {question.status}
                            </span>
                            <span>{question.likes || 0} likes</span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
                              disabled={deleteQuestionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 text-white border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-300">
                                Are you sure you want to delete this question? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}