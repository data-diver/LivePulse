import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";

interface WebSocketMessage {
  type: 'new_question' | 'question_status_updated' | 'question_liked';
  question: Question;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'new_question':
                // Invalidate questions queries to refetch
                queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
                queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
                queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
                break;
                
              case 'question_status_updated':
                // Invalidate all question-related queries
                queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
                queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
                queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
                break;
                
              case 'question_liked':
                // Update specific question in cache if possible
                queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected, attempting to reconnect...');
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
        // Retry connection after 3 seconds
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return {
    isConnected,
    participantCount
  };
}
