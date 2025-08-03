import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(true); // Show as connected since we're using polling
  const [participantCount, setParticipantCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use HTTP polling for reliable updates in all environments
    console.log('Using HTTP polling for real-time updates (every 3 seconds)');
    
    // Set up periodic polling to refresh data
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    }, 3000); // Poll every 3 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [queryClient]);

  return {
    isConnected,
    participantCount
  };
}