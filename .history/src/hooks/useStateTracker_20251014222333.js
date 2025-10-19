import { useEffect, useRef } from 'react';

export function useStateTracker(componentName, state) {
  const prevState = useRef(JSON.stringify(state));

  useEffect(() => {
    // Ensure mcpDebug client is available
    if (typeof window !== 'undefined' && window.mcpDebug) {
      const safeState = JSON.stringify(state);
      if (prevState.current !== safeState) {
        window.mcpDebug.trackStateChange(
          componentName,
          'state',
          prevState.current,
          safeState,
          'component-update'
        );
        prevState.current = safeState;
      }
    }
  }, [state]); // only re-run when `state` changes
}
