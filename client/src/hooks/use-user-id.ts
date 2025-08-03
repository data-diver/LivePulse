import { useState, useEffect } from 'react';

// Generate a simple user ID for the session
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function useUserId() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Try to get existing user ID from localStorage
    let storedUserId = localStorage.getItem('eventUserId');
    
    if (!storedUserId) {
      // Generate new user ID if none exists
      storedUserId = generateUserId();
      localStorage.setItem('eventUserId', storedUserId);
    }
    
    setUserId(storedUserId);
  }, []);

  return userId;
}