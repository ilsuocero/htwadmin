import { useEffect, useRef } from 'react';

// Helper function for shallow comparison
function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    const safeState = JSON.stringify(state);
    if (prevState.current !== safeState) {
      // Always log to console for immediate visibility
      console.group(`🔍 STATE CHANGE: ${componentName}`);
      console.log('Previous:', JSON.parse(prevState.current));
      console.log('Current:', state);
      console.groupEnd();
      
      // Also send to MCP server if available
      if (typeof window !== 'undefined' && window.mcpDebug) {
        window.mcpDebug.trackStateChange(
          componentName,
          'state',
          prevState.current,
          safeState,
          'component-update'
        );
      }
      
      prevState.current = safeState;
    }
  }, [componentName, state]); // re-run when componentName or state changes
}
