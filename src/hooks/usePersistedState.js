import { useState, useEffect } from 'react';

const usePersistedState = (key, defaultValue) => {
  // Try to get stored value from sessionStorage, fallback to defaultValue
  const [state, setState] = useState(() => {
    try {
      const storedValue = sessionStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Update sessionStorage when state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving state to sessionStorage: ${error}`);
    }
  }, [key, state]);

  return [state, setState];
};

export default usePersistedState;
