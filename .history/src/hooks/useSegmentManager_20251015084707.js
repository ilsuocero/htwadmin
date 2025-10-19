import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useSegmentManager = () => {
  const { state, dispatch } = useAppState();

  const saveSegment = useCallback(() => {
    // Check if we're in edit mode and have both endpoints snapped
    if (state.map.mode !== 'EDIT') {
      alert('You must be in edit mode to save a segment.');
      return;
    }

    if (!state.editMode.snap1 || !state.editMode.snap2) {
      alert('A segment must start/end from a crossroad or a destination!');
      return;
    }

    if (state.editMode.tempCoordinates.length === 0) {
      alert('No segment coordinates to save.');
      return;
    }

    console.log('Saving segment with coordinates:', state.editMode.tempCoordinates);
    console.log('Snap data:', { 
      snap1: state.editMode.snap1, 
      snap2: state.editMode.snap2 
    });

    dispatch({ 
      type: 'SHOW_PATH_FORM', 
      payload: { 
        coordinates: state.editMode.tempCoordinates,
        snap1: state.editMode.snap1,
        snap2: state.editMode.snap2
      }
    });
  }, [state.map.mode, state.editMode, dispatch]);

  const cancelSegment = useCallback(() => {
    console.log('🚀 SEGMENT MANAGER: Cancel segment called');
    
    // Remove the last point from the segment
    if (state.editMode.tempCoordinates.length > 0) {
      const newCoordinates = [...state.editMode.tempCoordinates];
      newCoordinates.pop();
      
      dispatch({ type: 'SET_EDIT_MODE_COORDINATES', payload: newCoordinates });
      
      // If we removed the last point, reset the first click state
      if (newCoordinates.length === 0) {
        dispatch({ type: 'SET_EDIT_MODE_SNAP1', payload: null });
        dispatch({ type: 'SET_EDIT_MODE_SNAP2', payload: null });
      }
      
      alert('No points to cancel');
    }
  }, [state.editMode.tempCoordinates, dispatch]);

  const quitSegment = useCallback(() => {
    const confirmed = window.confirm('Are you sure you want to quit segment creation? All unsaved changes will be lost.');
    if (confirmed) {
      dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
    }
  }, [dispatch]);

  return {
    saveSegment,
    cancelSegment,
    quitSegment,
    canSaveSegment: state.map.mode === 'EDIT' && state.editMode.snap1 && state.editMode.snap2 && state.editMode.tempCoordinates.length > 0
  };
};
