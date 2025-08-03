import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Question, EventSettings } from "@shared/schema";
import { NetworkBackground } from "@/components/ui/network-background";
import { QuestionCard } from "@/components/ui/question-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventSettingsDialog } from "@/components/ui/event-settings-dialog";
import { useWebSocket } from "@/hooks/use-websocket";
import { Brain, Users, CheckCircle, Clock, X, ArrowLeft, Settings } from "lucide-react";
import { Link } from "wouter";

export default function AdminPage() {
  const { isConnected } = useWebSocket();
  
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

  const { data: eventSettings } = useQuery<EventSettings>({
    queryKey: ['/api/event-settings'],
  });

  const approvedQuestions = allQuestions.filter(q => q.status === "approved");
  const rejectedQuestions = allQuestions.filter(q => q.status === "rejected");

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
                  <p className="text-sm text-gray-300" data-testid="text-event-title-admin">
                    {eventSettings?.title || "Learn & Build with AI"} - Question Management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full pulse-dot ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Live Connection' : 'Disconnected'}</span>
              </div>
              <EventSettingsDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--cyan-accent)] hover:text-[var(--light-cyan)] hover:bg-[var(--dark-teal)]/50"
                  data-testid="button-admin-settings"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Event Settings
                </Button>
              </EventSettingsDialog>
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

        {/* Question Management Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
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
        </Tabs>
      </main>
    </div>
  );
}
