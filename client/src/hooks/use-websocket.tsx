import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function usePolling() {
  const [isConnected, setIsConnected] = useState(true); // Always show as connected with polling
  const [participantCount, setParticipantCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use HTTP polling for reliable real-time updates
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