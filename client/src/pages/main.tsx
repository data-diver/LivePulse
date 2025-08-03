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

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        
        {/* QR Code Section */}
        <div className="mb-8 text-center">
          <div className="bg-[var(--deep-navy)]/50 backdrop-blur-sm rounded-2xl p-8 border border-[var(--cyan-accent)]/20">
            <h2 className="text-2xl font-bold mb-4">Join the Conversation</h2>
            <p className="text-gray-300 mb-6">Scan the QR code with your phone to submit questions</p>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* QR Code Display */}
              <QRCodeDisplay value={mobileUrl} size={192} />
              
              {/* Instructions */}
              <div className="flex-1 max-w-md">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[var(--cyan-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[var(--dark-teal)] font-bold text-sm">1</span>
                    </div>
                    <p className="text-sm">Scan the QR code with your phone camera</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[var(--cyan-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[var(--dark-teal)] font-bold text-sm">2</span>
                    </div>
                    <p className="text-sm">Submit your questions about AI development</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[var(--cyan-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[var(--dark-teal)] font-bold text-sm">3</span>
                    </div>
                    <p className="text-sm">Watch them appear here in real-time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Display */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Live Questions</h2>
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
      </main>

      {/* Connection Status */}
      <div className="fixed bottom-4 left-4 bg-[var(--deep-navy)]/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-[var(--cyan-accent)]/20">
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full pulse-dot ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isConnected ? 'Live Connection' : 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
}
