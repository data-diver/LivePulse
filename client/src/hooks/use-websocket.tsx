import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";

interface WebSocketMessage {
  type: 'new_question' | 'question_status_updated' | 'question_liked';
  question: Question;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(true); // Show as connected since we're using polling
  const [participantCount, setParticipantCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use polling instead of WebSocket for reliable updates in all environments
    console.log('Using HTTP polling for real-time updates (every 3 seconds)');
    
    // Set up periodic polling instead of WebSocket
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    }, 3000); // Poll every 3 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
    
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
