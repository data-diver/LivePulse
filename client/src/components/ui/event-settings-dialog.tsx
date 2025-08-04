import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Settings, Trash2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSettingsSchema, EventSettings, InsertEventSettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface EventSettingsDialogProps {
  children: React.ReactNode;
}

export function EventSettingsDialog({ children }: EventSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch current event settings
  const { data: eventSettings, isLoading } = useQuery<EventSettings>({
    queryKey: ['/api/event-settings'],
  });

  // Form setup
  const form = useForm<InsertEventSettings>({
    resolver: zodResolver(insertEventSettingsSchema),
    defaultValues: {
      title: eventSettings?.title || "Learn & Build with AI",
      subtitle: eventSettings?.subtitle || "Live Q&A Session",
    },
  });

  // Update form when data loads (using useEffect to prevent infinite re-renders)
  React.useEffect(() => {
    if (eventSettings && !form.formState.isDirty) {
      form.reset({
        title: eventSettings.title || "Learn & Build with AI",
        subtitle: eventSettings.subtitle || "Live Q&A Session",
      });
    }
  }, [eventSettings, form]);

  // Update event settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InsertEventSettings) => {
      return await apiRequest('PUT', '/api/event-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/event-settings'] });
      toast({
        title: "Settings updated",
        description: "Event settings have been successfully updated.",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to update event settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clear questions mutation
  const clearQuestionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/questions');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Responses cleared",
        description: "All responses have been successfully cleared.",
      });
    },
    onError: (error) => {
      console.error('Failed to clear questions:', error);
      toast({
        title: "Error",
        description: "Failed to clear responses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEventSettings) => {
    updateSettingsMutation.mutate(data);
  };

  const handleClearQuestions = () => {
    clearQuestionsMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[var(--deep-navy)] border-[var(--cyan-accent)]/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--cyan-accent)]">
            <Settings className="w-5 h-5" />
            Event Settings
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Update the event title and manage questions for a new event.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Event Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20 text-white"
                      placeholder="Enter event title"
                      data-testid="input-event-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Event Subtitle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20 text-white"
                      placeholder="Enter event subtitle"
                      data-testid="input-event-subtitle"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-[var(--cyan-accent)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Clear Responses</h4>
                  <p className="text-xs text-gray-400">Remove all responses for a new event</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                      disabled={clearQuestionsMutation.isPending}
                      data-testid="button-clear-questions"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[var(--deep-navy)] border-[var(--cyan-accent)]/20 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        Clear All Responses
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        This action cannot be undone. All responses (pending, approved, and rejected) will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[var(--dark-teal)] border-[var(--cyan-accent)]/20 text-white hover:bg-[var(--dark-teal)]/80">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearQuestions}
                        className="bg-red-600 text-white hover:bg-red-700"
                        data-testid="button-confirm-clear"
                      >
                        Clear All Responses
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-[var(--cyan-accent)]/20 text-gray-300 hover:bg-[var(--dark-teal)]/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending || isLoading}
                className="bg-[var(--cyan-accent)] text-[var(--dark-teal)] hover:bg-[var(--light-cyan)]"
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}