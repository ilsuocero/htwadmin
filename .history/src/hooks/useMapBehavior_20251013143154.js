import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  const handleEditModeClick = useCallback((e) => {
    console.log('Edit mode click at:', e.lngLat);
    // Add point to current segment
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    // Implementation for edit mode...
    // For now, just log the coordinates
    console.log('Edit mode - adding point at:', coordinates);
  }, []);
  
  const handleAutoSegmentClick = useCallback((e) => {
    console.log('Auto-segment mode click:', e.features?.[0]);
    // Handle crossroad selection for auto-segment
    const feature = e.features?.[0];
    if (feature && (feature.source === 'destinazioni' || feature.source === 'incroci')) {
      console.log('Selected crossroad:', feature);
      dispatch({ type: 'SELECT_CROSSROAD', payload: feature });
    }
  }, [dispatch]);
  
  const handleMapClick = useCallback((e) => {
    console.log('Map clicked in mode:', currentMode, 'at:', e.lngLat);
    
    switch (currentMode) {
      case 'NORMAL':
        // Handle normal click behavior
        console.log('Normal mode click - no specific action');
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
        console.log('Unknown mode:', currentMode);
        break;
    }
  }, [currentMode, handleEditModeClick, handleAutoSegmentClick]);
  
  const handleMapMouseDown = useCallback((e) => {
    console.log('Mouse down in mode:', currentMode);
    // Handle mouse down based on current mode
    if (currentMode === 'EDIT') {
      // Start drag operation in edit mode
      console.log('Starting drag operation in edit mode');
    }
  }, [currentMode]);
  
  const handleMapMouseMove = useCallback((e) => {
    // Handle mouse move based on current mode
    if (currentMode === 'EDIT' && state.editMode.isDragging) {
      // Update temporary point during drag
      console.log('Mouse move during drag:', e.lngLat);
    }
  }, [currentMode, state.editMode.isDragging]);
  
  const handleMapMouseUp = useCallback((e) => {
    console.log('Mouse up in mode:', currentMode);
    // Handle mouse up based on current mode
    if (currentMode === 'EDIT') {
      // End drag operation in edit mode
      console.log('Ending drag operation in edit mode');
    }
  }, [currentMode]);
  
  const handleContextMenu = useCallback((e) => {
    console.log('Context menu triggered in mode:', currentMode);
    if (currentMode === 'NORMAL') {
      e.preventDefault();
      console.log('Opening crossroad form at:', e.lngLat);
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
