import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, type InsertQuestion, type Question, type EventSettings } from "@shared/schema";
import { NetworkBackground } from "@/components/ui/network-background";
import { QuestionCard } from "@/components/ui/question-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Send, CheckCircle, MessageSquare } from "lucide-react";

export default function MobilePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'questions'>('submit');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions/approved'],
  });

  const { data: eventSettings } = useQuery<EventSettings>({
    queryKey: ['/api/event-settings'],
  });

  const form = useForm<InsertQuestion>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      content: "",
      author: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const response = await apiRequest("POST", "/api/questions", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
      // Removed toast notification since we have a dedicated success screen
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertQuestion) => {
    submitMutation.mutate(data);
  };

  const submitAnother = () => {
    setIsSubmitted(false);
    setActiveTab('submit');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[var(--dark-teal)] text-white">
        <NetworkBackground />
        
        <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
          <div className="bg-[var(--deep-navy)]/70 backdrop-blur-sm rounded-2xl p-8 border border-[var(--cyan-accent)]/20 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Question Posted!</h2>
            <p className="text-gray-300 mb-6">
              Your question is now live and visible to everyone! You can view and like other questions or submit another one.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setIsSubmitted(false);
                  setActiveTab('questions');
                }}
                className="w-full bg-[var(--cyan-accent)] hover:bg-[var(--light-cyan)] text-[var(--dark-teal)] font-semibold"
              >
                View All Questions
              </Button>
              <Button 
                onClick={submitAnother}
                variant="outline"
                className="w-full border-[var(--cyan-accent)] text-[var(--cyan-accent)] hover:bg-[var(--cyan-accent)] hover:text-[var(--dark-teal)]"
              >
                Submit Another Question
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--dark-teal)] text-white">
      <NetworkBackground />
      
      {/* Header */}
      <header className="relative z-10 bg-[var(--deep-navy)]/90 backdrop-blur-sm border-b border-[var(--cyan-accent)]/20 sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[var(--cyan-accent)]/20 rounded-lg flex items-center justify-center">
                <Brain className="text-[var(--cyan-accent)] text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold" data-testid="text-event-title-mobile">
                  {eventSettings?.title || "Learn & Build with AI"}
                </h1>
                <p className="text-sm text-gray-300" data-testid="text-event-subtitle-mobile">
                  {eventSettings?.subtitle || "Live Q&A Session"} - Mobile Interface
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full pulse-dot ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="relative z-10 bg-[var(--deep-navy)]/50 border-b border-[var(--cyan-accent)]/20 sticky top-[72px]">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'submit'
                  ? 'bg-[var(--cyan-accent)] text-[var(--dark-teal)]'
                  : 'text-gray-300 hover:text-white hover:bg-[var(--cyan-accent)]/20'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Submit Question
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'questions'
                  ? 'bg-[var(--cyan-accent)] text-[var(--dark-teal)]'
                  : 'text-gray-300 hover:text-white hover:bg-[var(--cyan-accent)]/20'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              All Questions ({questions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 pt-4">
        {activeTab === 'submit' ? (
          <div className="bg-[var(--deep-navy)]/50 backdrop-blur-sm rounded-2xl p-6 border border-[var(--cyan-accent)]/20 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-6">Ask your questions</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Anonymous"
                          className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/30 text-white placeholder-gray-400 focus:border-[var(--cyan-accent)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Question</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="What would you like to know?"
                          className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/30 text-white placeholder-gray-400 focus:border-[var(--cyan-accent)] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-[var(--cyan-accent)] hover:bg-[var(--light-cyan)] text-[var(--dark-teal)] font-semibold py-3"
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--dark-teal)]/30 border-t-[var(--dark-teal)] rounded-full animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Question
                    </>
                  )}
                </Button>
              </form>
            </Form>


          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[var(--deep-navy)]/70 rounded-xl p-6 border border-[var(--cyan-accent)]/20 animate-pulse">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-600 rounded w-20"></div>
                        <div className="h-3 bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[var(--cyan-accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-[var(--cyan-accent)]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                <p className="text-gray-400">Be the first to ask a question!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard 
                    key={question.id} 
                    question={question}
                    showAdminControls={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
