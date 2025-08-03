import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { useUserId } from "./use-user-id";

interface WebSocketMessage {
  type: 'new_question' | 'question_status_updated' | 'question_liked' | 'participant_count_updated';
  question?: Question;
  count?: number;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const userId = useUserId();

  useEffect(() => {
    // Clean up the host to remove any query parameters or tokens
    const cleanHost = window.location.host.split('?')[0].split('#')[0];
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${cleanHost}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    console.log('Original location:', window.location.href);
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected successfully');
          
          // Send user identification to server
          ws.send(JSON.stringify({
            type: 'identify',
            userId: userId
          }));
          
          // Request current participant count
          ws.send(JSON.stringify({
            type: 'request_participant_count'
          }));
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
                
              case 'participant_count_updated':
                // Update participant count in real-time
                if (typeof message.count === 'number') {
                  setParticipantCount(message.count);
                }
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
          console.error('Failed to connect to:', wsUrl);
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
  }, [queryClient, userId]);

  return {
    isConnected,
    participantCount
  };
}
