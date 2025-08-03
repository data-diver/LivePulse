import { useQuery } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { NetworkBackground } from "@/components/ui/network-background";
import { QuestionCard } from "@/components/ui/question-card";
import { QRCodeDisplay } from "@/components/ui/qr-code";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { Brain, Settings, RefreshCw, Users } from "lucide-react";
import { Link } from "wouter";

export default function MainPage() {
  const { isConnected } = useWebSocket();
  
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions/approved'],
  });

  const { data: stats } = useQuery<{
    totalQuestions: number;
    pendingQuestions: number;
    approvedQuestions: number;
    rejectedQuestions: number;
    activeUsers: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const mobileUrl = `${window.location.origin}/mobile`;

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
                <h1 className="text-xl font-bold">Learn & Build with AI</h1>
                <p className="text-sm text-gray-300">Live Q&A Session</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full pulse-dot ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{stats?.activeUsers || 0} participants</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="relative z-10 flex h-[calc(100vh-88px)]">
        
        {/* Left Side - Fixed QR Code Section */}
        <div className="w-1/3 min-w-[300px] max-w-[400px] flex-shrink-0 bg-[var(--deep-navy)]/50 backdrop-blur-sm border-r border-[var(--cyan-accent)]/20 p-6 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            {/* QR Code Display */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold mb-6">Join the Conversation</h2>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeDisplay value={mobileUrl} size={180} />
              </div>
              <p className="text-sm text-gray-300">Scan to submit questions</p>
            </div>
            
            {/* Instructions - Properly aligned */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-[var(--cyan-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--dark-teal)] font-bold text-sm">1</span>
                </div>
                <span className="text-sm">Scan QR code</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-[var(--cyan-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--dark-teal)] font-bold text-sm">2</span>
                </div>
                <span className="text-sm">Submit questions</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-[var(--cyan-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--dark-teal)] font-bold text-sm">3</span>
                </div>
                <span className="text-sm">See live updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Scrollable Questions Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Live Questions</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">{questions.length} questions</span>
                <Button variant="ghost" size="sm" className="text-[var(--cyan-accent)] hover:text-[var(--light-cyan)]">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

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
                  <Users className="w-8 h-8 text-[var(--cyan-accent)]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                <p className="text-gray-400">Questions will appear here once participants start submitting them.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
