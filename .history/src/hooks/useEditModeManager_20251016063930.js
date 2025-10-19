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
    } catch (error) {
      console.warn('EDIT MODE MANAGER: Error clearing event handlers:', error);
    }
  }, [mapRef]);

  // Setup event handlers based on mode - father state manages ALL events
  const setupEventHandlers = useCallback((mode, handlers = {}) => {
    console.log('🎯 EDIT MODE MANAGER: Setting up event handlers for mode:', mode);
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Clear existing handlers first
    clearAllEventHandlers();
    
    try {
      // Set up handlers based on mode
      switch (mode) {
        case 'NORMAL':
          setupNormalModeHandlers(map, handlers);
          break;
        case 'EDIT':
          setupEditModeHandlers(map, handlers);
          break;
        case 'AUTO_SEGMENT':
          setupAutoSegmentHandlers(map, handlers);
          break;
        default:
          setupNormalModeHandlers(map, handlers);
      }
    } catch (error) {
      console.error('EDIT MODE MANAGER: Error setting up event handlers:', error);
    }
  }, [mapRef, clearAllEventHandlers]);

  // Normal mode handlers - father state manages ALL events
  const setupNormalModeHandlers = useCallback((map, handlers) => {
    console.log('🎯 EDIT MODE MANAGER: Setting up NORMAL mode handlers');
    
    try {
      // Context menu
      if (handlers.contextmenu) {
        map.on('contextmenu', handlers.contextmenu);
        eventHandlersRef.current.contextmenu = handlers.contextmenu;
      }
      
      // Basic mouse handlers
      if (handlers.mousemove) {
        map.on('mousemove', handlers.mousemove);
        eventHandlersRef.current.mousemove = handlers.mousemove;
      }
      
      if (handlers.mouseup) {
        map.on('mouseup', handlers.mouseup);
        eventHandlersRef.current.mouseup = handlers.mouseup;
      }
      
      // Layer-specific handlers only if layers exist
      if (map.getSource('sentieri')) {
        console.log('🎯 EDIT MODE MANAGER: Setting mouse event for sentieri');
        
        // Segment click handler
        const sentieriClickHandler = (e) => {
          console.log('🎯 EDIT MODE MANAGER: click on sentieri');
          const feature = e.features?.[0];
          if (feature) {
            console.log('🎯 EDIT MODE MANAGER: Segment clicked:', feature.properties);
            const description = feature.properties?.Nome || 'Unnamed segment';
            alert(`Segment: ${description}\nID: ${feature.properties?.id}`);
          }
        };
        
        map.on('click', 'sentieri', sentieriClickHandler);
        eventHandlersRef.current.click = sentieriClickHandler;
        
        // Hover behavior for sentieri (segments)
        map.on('mouseenter', 'sentieri', (e) => {
          const featureId = e.features[0].properties.id;
          map.setPaintProperty('sentieri', 'line-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            '#ff0000', // Hover color
            '#ff000080' // Default color
          ]);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'sentieri', () => {
          map.setPaintProperty('sentieri', 'line-color', '#ff000080');
          map.getCanvas().style.cursor = '';
        });
      }
      
      // Similar handlers for destinazioni and incroci...
      // (Implementation would follow the same pattern)
      
    } catch (error) {
      console.error('EDIT MODE MANAGER: Error setting up normal handlers:', error);
    }
  }, []);

  // Edit mode handlers - father state manages ALL events
  const setupEditModeHandlers = useCallback((map, handlers) => {
    console.log('🎯 EDIT MODE MANAGER: Setting up EDIT mode handlers');
    
    try {
      map.getCanvas().style.cursor = 'crosshair';
      
      // Use layer-specific click handlers ONLY for edit mode
      if (handlers.click) {
        // Add layer-specific handlers for crossroads/destinations
        if (map.getLayer('destinazioni')) {
          map.on('click', 'destinazioni', handlers.click);
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
