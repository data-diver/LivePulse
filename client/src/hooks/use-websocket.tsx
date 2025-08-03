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
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const maxRetries = 3;

  useEffect(() => {
    // Simple approach: replace http/https with ws/wss in the current origin
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    console.log('Window location details:', {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      href: window.location.href
    });
    
    const connect = () => {
      try {
        console.log('Attempting WebSocket connection to:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Add a timeout to detect connection failures
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            console.warn('WebSocket connection timeout, closing...');
            ws.close();
          }
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          setIsConnected(true);
          setRetryCount(0); // Reset retry count on successful connection
          console.log('WebSocket connected successfully');
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
          clearTimeout(connectionTimeout);
          setIsConnected(false);
          console.log('WebSocket disconnected');
          
          // Only retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`Attempting to reconnect (${retryCount + 1}/${maxRetries})...`);
            setRetryCount(prev => prev + 1);
            setTimeout(connect, 3000);
          } else {
            console.warn('Max WebSocket retry attempts reached. Disabling real-time updates.');
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.error('Failed to connect to:', wsUrl);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
        
        if (retryCount < maxRetries) {
          console.log(`WebSocket creation failed, retrying (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(prev => prev + 1);
          setTimeout(connect, 3000);
        } else {
          console.warn('Max WebSocket retry attempts reached. Application will work without real-time updates.');
        }
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
