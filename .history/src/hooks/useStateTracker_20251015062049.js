import { useEffect, useRef } from 'react';

// Helper function for shallow comparison
function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
}

export function useStateTracker(componentName, state) {
  const prevState = useRef(state);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip comparison on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevState.current = state;
      return;
    }

    // Use shallow comparison instead of JSON.stringify for performance
    if (!shallowEqual(prevState.current, state)) {
      // Always log to console for immediate visibility
      console.group(`🔍 STATE CHANGE: ${componentName}`);
      console.log('Previous:', prevState.current);
      console.log('Current:', state);
      console.groupEnd();
      
      // Also send to MCP server if available
      if (typeof window !== 'undefined' && window.mcpDebug) {
        window.mcpDebug.trackStateChange(
          componentName,
          'state',
          prevState.current,
          state,
          'component-update'
        );
      }
      
      prevState.current = state;
    }
  }, [componentName, state]); // re-run when componentName or state changes
