import { useEffect, useRef } from 'react';

export function useStateTracker(componentName, state) {
  const prevState = useRef(state);

  useEffect(() => {
    if (prevState.current !== state) {
      // Log state changes to console for debugging
      console.group(`🔍 STATE CHANGE: ${componentName}`);
      console.log('Previous:', prevState.current);
      console.log('Current:', state);
      console.groupEnd();
      
      prevState.current = state;
    }
  }, [componentName, state]);
