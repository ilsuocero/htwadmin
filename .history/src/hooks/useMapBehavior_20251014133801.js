import { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  // Refs to track segment creation state
  const tempPointsRef = useRef([]);
  const snapCrossRef = useRef(null);
  const snap1Ref = useRef(null);
  const snap2Ref = useRef(null);

  // Function to initialize segment creation mode
  const initializeSegmentCreation = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    console.log('Initializing segment creation mode');
    
    // Reset state
    tempPointsRef.current = [];
    snapCrossRef.current = null;
    snap1Ref.current = null;
    snap2Ref.current = null;
    
    // Set cursor to crosshair
    map.getCanvas().style.cursor = 'crosshair';
    
    // Create temporary sources and layers if they don't exist
    if (!map.getSource('tempLineSource')) {
      map.addSource('tempLineSource', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }
    
    if (!map.getSource('tempPointSource')) {
      map.addSource('tempPointSource', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }
    
    if (!map.getLayer('tempLineLayer')) {
      map.addLayer({
        id: 'tempLineLayer',
        type: 'line',
        source: 'tempLineSource',
        paint: {
          'line-color': 'red',
          'line-width': 2,
        },
      });
    }
    
    if (!map.getLayer('tempPointLayer')) {
      map.addLayer({
        id: 'tempPointLayer',
        type: 'circle',
        source: 'tempPointSource',
        paint: {
          'circle-radius': 4,
          'circle-color': 'blue',
        },
      });
    }
    
    // Set up snapping detection for crossroads and destinations
    ['destinazioni', 'incroci'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.on('mouseenter', layerId, (e) => {
          const featureId = e.features[0].properties.id;
          const clickedCoordinates = e.features[0].geometry.coordinates;
          snapCrossRef.current = { clickedCoordinates, featureId, featureType: layerId };
          console.log('Snap detected on', layerId, 'feature:', featureId);
        });
        
        map.on('mouseleave', layerId, () => {
          snapCrossRef.current = null;
        });
      }
    });
    }
  }, [mapRef]);
  
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
    console.log('🚀 useMapBehavior: Map clicked in mode:', currentMode, 'at:', e.lngLat);
    console.log('🚀 useMapBehavior: Click event features:', e.features?.length || 0);
    
    switch (currentMode) {
      case 'NORMAL':
        // Handle normal click behavior
        console.log('🚀 useMapBehavior: Normal mode click - no specific action');
        break;
        
      case 'EDIT':
        // Handle edit mode click
        console.log('🚀 useMapBehavior: Edit mode click - calling handleEditModeClick');
        handleEditModeClick(e);
        break;
        
      case 'AUTO_SEGMENT':
        // Handle auto-segment mode click
        console.log('🚀 useMapBehavior: Auto-segment mode click - calling handleAutoSegmentClick');
        handleAutoSegmentClick(e);
        break;
        
      default:
        console.log('🚀 useMapBehavior: Unknown mode:', currentMode);
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
      console.log('Opening context menu at:', e.point, 'coordinates:', e.lngLat);
      dispatch({ 
        type: 'SHOW_CONTEXT_MENU', 
        payload: { 
          position: { x: e.point.x, y: e.point.y },
          coordinates: e.lngLat 
        }
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
