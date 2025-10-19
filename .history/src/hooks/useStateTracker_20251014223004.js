import { useEffect, useRef } from 'react';

export function useStateTracker(componentName, state) {
  const prevState = useRef(JSON.stringify(state));

  useEffect(() => {
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
