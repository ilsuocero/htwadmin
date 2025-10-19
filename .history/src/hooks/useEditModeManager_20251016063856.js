import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useEditModeManager = (mapRef) => {
  const { state, dispatch } = useAppState();
  
  // Father state - manages ALL edit mode state AND ALL event handlers
  const [currentMode, setCurrentMode] = useState('NORMAL');
  const [publicCurrentMode, setPublicCurrentMode] = useState('NORMAL');
  
  // All edit mode state management here
  const isFirstClickRef = useRef(true);
  const tempPointsRef = useRef([]);
  
  // Event handler refs - father state manages ALL event handlers
  const eventHandlersRef = useRef({
    click: null,
    contextmenu: null,
    mousedown: null,
    mousemove: null,
    mouseup: null,
    mouseenter: {},
    mouseleave: {}
  });
  
  // Sync with global state
  useEffect(() => {
    setCurrentMode(state.map.mode);
  }, [state.map.mode]);
  
  // When mode changes, update both states
  useEffect(() => {
    console.log('🎯 EDIT MODE MANAGER: Mode changed -', currentMode);
    setPublicCurrentMode(currentMode);
    
    if (currentMode === 'EDIT') {
      console.log('🎯 EDIT MODE MANAGER: Entering EDIT mode - resetting state');
      isFirstClickRef.current = true;
      tempPointsRef.current = [];
      
      // Initialize temporary sources
      const map = mapRef.current?.getMap();
      if (map) {
        initializeTemporarySources(map);
        map.getCanvas().style.cursor = 'crosshair';
      }
    } else {
      console.log('🎯 EDIT MODE MANAGER: Exiting EDIT mode - cleaning up');
      // Clean up temporary sources
      const map = mapRef.current?.getMap();
      if (map) {
        cleanupTemporarySources(map);
        map.getCanvas().style.cursor = '';
      }
    }
  }, [currentMode, mapRef]);
  
  const initializeTemporarySources = (map) => {
    // Create temporary sources and layers if they don't exist
    if (!map.getSource('tempLineSource')) {
      map.addSource('tempLineSource', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    
    if (!map.getSource('tempPointSource')) {
      map.addSource('tempPointSource', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    
    if (!map.getLayer('tempLineLayer')) {
      map.addLayer({
        id: 'tempLineLayer',
        type: 'line',
        source: 'tempLineSource',
        paint: { 'line-color': 'red', 'line-width': 2 },
      });
    }
    
    if (!map.getLayer('tempPointLayer')) {
      map.addLayer({
        id: 'tempPointLayer',
        type: 'circle',
        source: 'tempPointSource',
        paint: { 'circle-radius': 4, 'circle-color': 'blue' },
      });
    }
  };
  
  const cleanupTemporarySources = (map) => {
    // Clean up temporary sources and layers
    if (map.getLayer('tempLineLayer')) {
      map.removeLayer('tempLineLayer');
    }
    
    if (map.getLayer('tempPointLayer')) {
      map.removeLayer('tempPointLayer');
    }
    
    if (map.getSource('tempLineSource')) {
      map.removeSource('tempLineSource');
    }
    
    if (map.getSource('tempPointSource')) {
      map.removeSource('tempPointSource');
    }
  };
  
  const updateTemporarySources = useCallback((map, points) => {
    // Update temporary point source
    const tempPointSource = map.getSource('tempPointSource');
    if (tempPointSource) {
      const tempPointData = {
        type: 'FeatureCollection',
        features: points,
      };
      tempPointSource.setData(tempPointData);
    }
    
    // Update temporary line source
    const tempLineSource = map.getSource('tempLineSource');
    if (tempLineSource) {
      const lineStringFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points.map(point => point.geometry.coordinates),
        },
        properties: {},
      };
      tempLineSource.setData(lineStringFeature);
    }
  }, []);

  // Father state manages ALL event handlers
  const clearAllEventHandlers = useCallback(() => {
    console.log('🎯 EDIT MODE MANAGER: Clearing ALL event handlers');
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    try {
      // Clear general listeners
      map.off('click');
      map.off('contextmenu');
      map.off('mousedown');
      map.off('mousemove');
      map.off('mouseup');
      
      // Clear layer-specific listeners
      ['sentieri', 'destinazioni', 'incroci'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId);
          map.off('mousedown', layerId);
          map.off('mouseenter', layerId);
          map.off('mouseleave', layerId);
        }
      });
      
      // Reset event handlers ref
      eventHandlersRef.current = {
        click: null,
        contextmenu: null,
        mousedown: null,
        mousemove: null,
        mouseup: null,
        mouseenter: {},
        mouseleave: {}
      };
          // Show completion popup when both endpoints are snapped
          setTimeout(() => {
            const confirmed = window.confirm('Segment completed!\n\nClick "Save" to save the segment or "Continue" to keep editing.');
            if (confirmed) {
              // User clicked Save - show the PathForm
              dispatch({ 
                type: 'SHOW_PATH_FORM', 
                payload: { 
                  coordinates: tempPointsRef.current.map(point => point.geometry.coordinates),
                  snap1: state.editMode.snap1,
                  snap2: state.editMode.snap2
                }
              });
            } else {
              // User clicked Continue - stay in edit mode
              console.log('User chose to continue editing');
            }
          }, 100);
        }
        
        // Add the snapped point to our temporary points
        const clickedPoint = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: clickedCoordinates,
          },
          properties: {},
        };
        
        tempPointsRef.current.push(clickedPoint);
        
        // Update temporary sources
        updateTemporarySources(map, tempPointsRef.current);
        
        // Update global state with coordinates
        const coordinates = tempPointsRef.current.map(point => point.geometry.coordinates);
        dispatch({ type: 'SET_EDIT_MODE_COORDINATES', payload: coordinates });
        
        return; // Exit early since we handled a feature click
      }
    }
    
    // If we get here, we clicked on empty map (no features)
    if (isFirstClickRef.current) {
      // First click must be on a crossroad/destination
      alert('You must start from a destination or a crossroad. \nWarning: before creating the segment check if both \nendpoints ( )<-segment->( ) are in place.');
      return;
    }
    
    // Add intermediate point on empty map
    const clickedCoords = [e.lngLat.lng, e.lngLat.lat];
    const clickedPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: clickedCoords,
      },
      properties: {},
    };
    
    tempPointsRef.current.push(clickedPoint);
    updateTemporarySources(map, tempPointsRef.current);
    
    // Update global state with coordinates
    const coordinates = tempPointsRef.current.map(point => point.geometry.coordinates);
    dispatch({ type: 'SET_EDIT_MODE_COORDINATES', payload: coordinates });
    
  }, [mapRef, dispatch, state.editMode.snap1, state.editMode.snap2, updateTemporarySources]);
  
  const cancelEditing = useCallback(() => {
    console.log('🎯 EDIT MODE MANAGER: CANCEL EDITING FUNCTION CALLED!');
    console.log('🎯 EDIT MODE MANAGER: Current state before cancellation:', {
      currentMode,
      tempPointsCount: tempPointsRef.current.length,
      isFirstClick: isFirstClickRef.current,
      globalEditMode: state.editMode
    });
    
    const map = mapRef.current?.getMap();
    if (map) {
      console.log('🎯 EDIT MODE MANAGER: Cleaning up temporary features from map');
      
      // Clean up temporary sources and layers
      if (map.getLayer('tempLineLayer')) {
        console.log('🎯 EDIT MODE MANAGER: Removing tempLineLayer');
        map.removeLayer('tempLineLayer');
      } else {
        console.log('🎯 EDIT MODE MANAGER: tempLineLayer not found');
      }
      
      if (map.getLayer('tempPointLayer')) {
        console.log('🎯 EDIT MODE MANAGER: Removing tempPointLayer');
        map.removeLayer('tempPointLayer');
      } else {
        console.log('🎯 EDIT MODE MANAGER: tempPointLayer not found');
      }
      
      if (map.getSource('tempLineSource')) {
        console.log('🎯 EDIT MODE MANAGER: Removing tempLineSource');
        map.removeSource('tempLineSource');
      } else {
        console.log('🎯 EDIT MODE MANAGER: tempLineSource not found');
      }
      
      if (map.getSource('tempPointSource')) {
        console.log('🎯 EDIT MODE MANAGER: Removing tempPointSource');
        map.removeSource('tempPointSource');
      } else {
        console.log('🎯 EDIT MODE MANAGER: tempPointSource not found');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      console.log('🎯 EDIT MODE MANAGER: Cursor reset to default');
    } else {
      console.log('🎯 EDIT MODE MANAGER: Map not available for cleanup');
    }
    
    // Reset local state
    tempPointsRef.current = [];
    isFirstClickRef.current = true;
    console.log('🎯 EDIT MODE MANAGER: Local state reset - tempPoints:', tempPointsRef.current.length, 'isFirstClick:', isFirstClickRef.current);
    
    // Reset global edit mode state
    console.log('🎯 EDIT MODE MANAGER: Dispatching RESET_EDIT_MODE to clear global state');
    dispatch({ type: 'RESET_EDIT_MODE' });
    
    // Exit edit mode
    console.log('🎯 EDIT MODE MANAGER: Dispatching SET_MAP_MODE to NORMAL');
    dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
    
    console.log('🎯 EDIT MODE MANAGER: Cancel editing completed successfully!');
  }, [mapRef, dispatch, currentMode, state.editMode]);
  
  return {
    // Father state
    currentMode,
    publicCurrentMode,
    
    // Edit mode state
    isFirstClickRef,
    tempPointsRef,
    
    // Actions
    handleEditModeClick,
    cancelEditing,
    updateTemporarySources,
  };
};
