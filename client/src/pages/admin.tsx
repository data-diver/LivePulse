import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question, EventSettings } from "@shared/schema";
import { NetworkBackground } from "@/components/ui/network-background";
import { QuestionCard } from "@/components/ui/question-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Users, CheckCircle, Clock, X, ArrowLeft, Settings, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
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

export default function AdminPage() {
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eventName, setEventName] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  
  const { data: stats } = useQuery<{
    totalQuestions: number;
    pendingQuestions: number;
    approvedQuestions: number;
    rejectedQuestions: number;
    activeUsers: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: pendingQuestions = [], isLoading: pendingLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions/pending'],
  });

  const { data: allQuestions = [], isLoading: allLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  // Fetch current event settings
  const { data: settings, isLoading: settingsLoading } = useQuery<EventSettings>({
    queryKey: ['/api/settings']
  });

  const approvedQuestions = allQuestions.filter(q => q.status === "approved");
  const rejectedQuestions = allQuestions.filter(q => q.status === "rejected");

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

  // Handler functions
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

  return (
    <div className="min-h-screen bg-[var(--dark-teal)] text-white">
      <NetworkBackground />
      
      {/* Header */}
      <header className="relative z-10 bg-[var(--deep-navy)]/90 backdrop-blur-sm border-b border-[var(--cyan-accent)]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-[var(--cyan-accent)] hover:text-[var(--light-cyan)]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[var(--cyan-accent)]/20 rounded-lg flex items-center justify-center">
                  <Brain className="text-[var(--cyan-accent)] text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Panel</h1>
                  <p className="text-sm text-gray-300">Question Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full pulse-dot ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Live Connection' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--cyan-accent)]">
                {stats?.totalQuestions || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.approvedQuestions || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {stats?.pendingQuestions || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--cyan-accent)]">
                {stats?.activeUsers || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management Tabs */}
        <Tabs defaultValue={pendingQuestions.length > 0 ? "pending" : "settings"} className="space-y-4">
          <TabsList className="bg-[var(--deep-navy)]/50 border border-[var(--cyan-accent)]/20">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-[var(--cyan-accent)] data-[state=active]:text-[var(--dark-teal)]"
            >
              <Clock className="w-4 h-4 mr-2" />
              Pending ({pendingQuestions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="approved"
              className="data-[state=active]:bg-[var(--cyan-accent)] data-[state=active]:text-[var(--dark-teal)]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved ({approvedQuestions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="rejected"
              className="data-[state=active]:bg-[var(--cyan-accent)] data-[state=active]:text-[var(--dark-teal)]"
            >
              <X className="w-4 h-4 mr-2" />
              Rejected ({rejectedQuestions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-[var(--cyan-accent)] data-[state=active]:text-[var(--dark-teal)]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[var(--deep-navy)]/70 rounded-xl p-6 border border-[var(--cyan-accent)]/20 animate-pulse">
                    <div className="h-20 bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : pendingQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[var(--cyan-accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-[var(--cyan-accent)]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pending questions</h3>
                <p className="text-gray-400">All questions have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    showAdminControls={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {allLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[var(--deep-navy)]/70 rounded-xl p-6 border border-[var(--cyan-accent)]/20 animate-pulse">
                    <div className="h-20 bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : approvedQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No approved questions yet</h3>
                <p className="text-gray-400">Approved questions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {allLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[var(--deep-navy)]/70 rounded-xl p-6 border border-[var(--cyan-accent)]/20 animate-pulse">
                    <div className="h-20 bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : rejectedQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No rejected questions</h3>
                <p className="text-gray-400">Rejected questions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejectedQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Event Configuration */}
            <Card className="bg-[var(--deep-navy)]/70 border-[var(--cyan-accent)]/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
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
                      className="bg-[var(--dark-teal)]/50 border-[var(--cyan-accent)]/30 text-white placeholder:text-white/60"
                    />
                    <Button 
                      onClick={handleUpdateEventName}
                      disabled={updateSettingsMutation.isPending || !eventName.trim() || eventName === settings?.eventName}
                      className="bg-[var(--cyan-accent)] hover:bg-[var(--cyan-accent)]/80 text-[var(--dark-teal)]"
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">
                    This name will appear on all screens and is used for future events.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoApprove">Auto-approve Questions</Label>
                      <p className="text-sm text-gray-400">
                        When enabled, new questions are automatically approved. When disabled, questions require manual approval.
                      </p>
                    </div>
                    <button
                      id="autoApprove"
                      onClick={handleToggleAutoApprove}
                      disabled={updateSettingsMutation.isPending}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--cyan-accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        autoApprove ? 'bg-[var(--cyan-accent)]' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          autoApprove ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Management */}
            <Card className="bg-[var(--deep-navy)]/70 border-[var(--cyan-accent)]/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Question Management
                  </div>
                  <div className="text-sm font-normal text-gray-400">
                    {allQuestions.length} total questions
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
                        disabled={allQuestions.length === 0 || deleteAllQuestionsMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteAllQuestionsMutation.isPending ? "Deleting..." : "Clear All"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[var(--deep-navy)] border-[var(--cyan-accent)]/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          This action cannot be undone. This will permanently delete all {allQuestions.length} questions from this event session.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAllQuestions}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, delete all questions
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Individual Questions */}
                <div className="space-y-2">
                  <h3 className="font-medium">Individual Questions</h3>
                  {allQuestions.length === 0 ? (
                    <p className="text-center py-8 text-gray-400">No questions to manage</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allQuestions.map((question) => (
                        <div key={question.id} className="flex items-center justify-between p-3 bg-[var(--dark-teal)]/30 rounded-lg border border-[var(--cyan-accent)]/10">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{question.content}</p>
                            <p className="text-xs text-gray-400">
                              {question.author} • {question.status} • {question.likes} likes
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[var(--deep-navy)] border-[var(--cyan-accent)]/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Question?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
