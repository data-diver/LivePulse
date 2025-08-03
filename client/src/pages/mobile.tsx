import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, type InsertQuestion } from "@shared/schema";
import { NetworkBackground } from "@/components/ui/network-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Send, CheckCircle } from "lucide-react";

export default function MobilePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: "Success!",
        description: "Your question has been submitted and is pending approval.",
      });
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
            
            <h2 className="text-2xl font-bold mb-4">Question Submitted!</h2>
            <p className="text-gray-300 mb-6">
              Thank you for your question. It has been submitted for review and will appear on the main screen once approved.
            </p>
            
            <Button 
              onClick={submitAnother}
              className="w-full bg-[var(--cyan-accent)] hover:bg-[var(--light-cyan)] text-[var(--dark-teal)] font-semibold"
            >
              Submit Another Question
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--dark-teal)] text-white">
      <NetworkBackground />
      
      {/* Header */}
      <header className="relative z-10 bg-[var(--deep-navy)]/90 backdrop-blur-sm border-b border-[var(--cyan-accent)]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[var(--cyan-accent)]/20 rounded-lg flex items-center justify-center">
              <Brain className="text-[var(--cyan-accent)] text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Submit Your Question</h1>
              <p className="text-sm text-gray-300">Learn & Build with AI Event</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="bg-[var(--deep-navy)]/50 backdrop-blur-sm rounded-2xl p-6 border border-[var(--cyan-accent)]/20 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-6">Ask anything about AI development</h3>
          
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
                        placeholder="Ask anything about AI development, tools, best practices, or implementation..."
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Question
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-[var(--cyan-accent)]/10 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong>Tips for great questions:</strong><br />
              • Be specific about your AI development challenges<br />
              • Ask about tools, frameworks, or best practices<br />
              • Questions about implementation details are welcome<br />
              • Keep it relevant to AI development and learning
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
