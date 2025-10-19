import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  const handleMapClick = useCallback((e) => {
    console.log('Map clicked in mode:', currentMode);
    
    switch (currentMode) {
      case 'NORMAL':
        // Handle normal click behavior
        break;
        
      case 'EDIT':
        // Handle edit mode click
        handleEditModeClick(e);
        break;
        
      case 'AUTO_SEGMENT':
        // Handle auto-segment mode click
        handleAutoSegmentClick(e);
        break;
        
      default:
        break;
    }
  }, [currentMode]);
  
  const handleEditModeClick = useCallback((e) => {
    // Add point to current segment
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    // Implementation for edit mode...
  }, []);
  
  const handleAutoSegmentClick = useCallback((e) => {
    // Handle crossroad selection for auto-segment
    const feature = e.features?.[0];
    if (feature && (feature.source === 'destinazioni' || feature.source === 'incroci')) {
      dispatch({ type: 'SELECT_CROSSROAD', payload: feature });
    }
  }, [dispatch]);
  
  const handleMapMouseDown = useCallback((e) => {
    // Handle mouse down based on current mode
  }, [currentMode]);
  
  const handleMapMouseMove = useCallback((e) => {
    // Handle mouse move based on current mode
  }, [currentMode]);
  
  const handleMapMouseUp = useCallback((e) => {
    // Handle mouse up based on current mode
  }, [currentMode]);
  
  const handleContextMenu = useCallback((e) => {
    if (currentMode === 'NORMAL') {
      e.preventDefault();
      dispatch({ 
        type: 'SHOW_CROSSROAD_FORM', 
        payload: { coordinates: e.lngLat } 
      });
    }
  }, [currentMode, dispatch]);
  
  return {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  };
};
