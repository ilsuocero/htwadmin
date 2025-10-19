import React, { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  // Refs to track segment creation state
  const tempPointsRef = useRef([]);
  const snapCrossRef = useRef(null);

  // Function to initialize segment creation mode
  const initializeSegmentCreation = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    console.log('Initializing segment creation mode');
    
    // Reset state
    tempPointsRef.current = [];
    snapCrossRef.current = null;
    
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
  }, [mapRef]);
  
  const handleEditModeClick = useCallback((e) => {
    console.log('Edit mode click at:', e.lngLat);
    
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Check if we already have both endpoints snapped
    if (state.editMode.snap1 && state.editMode.snap2) {
      alert('You already concluded the segment. \nSave it or Quit. \nTo continue to edit, cancel one or some sub-segment.');
      return;
    }
    
    let clickedCoords = [e.lngLat.lng, e.lngLat.lat];
    
    // Check if we're snapping to an existing feature
    if (snapCrossRef.current) {
      const { clickedCoordinates, featureId, featureType } = snapCrossRef.current;
      console.log('Snapping to feature:', featureId, clickedCoordinates);
      clickedCoords = clickedCoordinates;
      
      // Store the snap coordinates in global state
      if (!state.editMode.snap1) {
        console.log('First snap to feature');
        dispatch({ 
          type: 'SET_EDIT_MODE_SNAP1', 
          payload: { clickedCoords, featureId, featureType } 
        });
      } else {
        console.log('Second snap to feature');
        dispatch({ 
          type: 'SET_EDIT_MODE_SNAP2', 
          payload: { clickedCoords, featureId, featureType } 
        });
      }
    } else {
      // The segment must start and end from a destination or a crossroad
      if (!state.editMode.snap1) {
    
    // Add the clicked point to our temporary points
    const clickedPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: clickedCoords,
      },
      properties: {},
    };
    
    tempPointsRef.current.push(clickedPoint);
    
    // Update the temporary point source
    const tempPointSource = map.getSource('tempPointSource');
    if (tempPointSource) {
      const tempPointData = {
        type: 'FeatureCollection',
        features: tempPointsRef.current,
      };
      tempPointSource.setData(tempPointData);
    }
    
    // Update the temporary line source
    const tempLineSource = map.getSource('tempLineSource');
    if (tempLineSource) {
      const lineStringFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: tempPointsRef.current.map(point => point.geometry.coordinates),
        },
        properties: {},
      };
      tempLineSource.setData(lineStringFeature);
    }
    
    // If we have both endpoints snapped, show completion popup
    if (snap1Ref.current && snap2Ref.current) {
      console.log('Segment ready for saving - both endpoints snapped, showing completion popup');
      const confirmed = window.confirm('Segment completed!\n\nPress "s" to save\nPress "esc" to cancel editing\nPress "canc" to cancel points\n\nClick OK to continue editing or Cancel to close this message.');
      if (!confirmed) {
        // User clicked Cancel, so we don't show the popup again
        console.log('User dismissed completion popup');
      }
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
  
  const saveSegment = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    if (!snap2Ref.current) {
      alert('A segment must start/end from a crossroad or a destination!');
      return;
    }
    
    // Get the coordinates of the segment
    const coordinates = tempPointsRef.current.map(point => point.geometry.coordinates);
    
    if (coordinates.length > 0) {
      // Ensure first and last coordinates match snapped endpoints exactly
      if (snap1Ref.current) {
        coordinates[0] = snap1Ref.current.clickedCoords;
      }
      if (snap2Ref.current) {
        coordinates[coordinates.length - 1] = snap2Ref.current.clickedCoords;
      }
      
      console.log('Saving segment with coordinates:', coordinates);
      console.log('Snap data:', { snap1: snap1Ref.current, snap2: snap2Ref.current });
      
      dispatch({ 
        type: 'SHOW_PATH_FORM', 
        payload: { 
          coordinates: coordinates,
          snap1: snap1Ref.current,
          snap2: snap2Ref.current
        }
      });
      
      // Clean up temporary layers and reset state
      cleanupSegmentCreation();
    }
  }, [mapRef, dispatch]);
  
  const cancelSegment = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    if (tempPointsRef.current.length > 0) {
      // Remove the last point
      tempPointsRef.current.pop();
      
      // Update the line feature based on the remaining points
      const tempLineSource = map.getSource('tempLineSource');
      if (tempLineSource) {
        const lineStringFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: tempPointsRef.current.map(point => point.geometry.coordinates),
          },
          properties: {},
        };
        tempLineSource.setData(lineStringFeature);
      }
      
      // Update the point source
      const tempPointSource = map.getSource('tempPointSource');
      if (tempPointSource) {
        const tempPointData = {
          type: 'FeatureCollection',
          features: tempPointsRef.current,
        };
        tempPointSource.setData(tempPointData);
      }
      
      snap2Ref.current = null; // Reset second snap
    }
  }, [mapRef]);
  
  const quitSegment = useCallback(() => {
    const confirmed = window.confirm('Are you sure you want to quit segment creation? All unsaved changes will be lost.');
    if (confirmed) {
      cleanupSegmentCreation();
      dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
    }
  }, [dispatch]);
  
  const cleanupSegmentCreation = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Remove temporary layers and sources
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
    
    // Remove snapping event listeners
    ['destinazioni', 'incroci'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.off('mouseenter', layerId);
        map.off('mouseleave', layerId);
      }
    });
    
    // Reset state
    tempPointsRef.current = [];
    snapCrossRef.current = null;
    snap1Ref.current = null;
    snap2Ref.current = null;
    
    // Reset cursor
    map.getCanvas().style.cursor = '';
  }, [mapRef]);
  
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
  
  // Initialize segment creation when entering edit mode
  React.useEffect(() => {
    if (currentMode === 'EDIT') {
      initializeSegmentCreation();
    }
  }, [currentMode, initializeSegmentCreation]);
  
  // Keyboard event handling for segment creation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentMode === 'EDIT') {
        console.log('Key pressed in edit mode:', e.key, 'keyCode:', e.keyCode);
        
        // Delete key (46) - cancel last point
        if (e.keyCode === 46) {
          e.preventDefault();
          cancelSegment();
        }
        // 's' key (83) - save segment
        else if (e.keyCode === 83) {
          e.preventDefault();
          saveSegment();
        }
        // 'q' key (81) - quit segment creation
        else if (e.keyCode === 81) {
          e.preventDefault();
          quitSegment();
        }
        // ESC key (27) - quit segment creation
        else if (e.keyCode === 27) {
          e.preventDefault();
          quitSegment();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMode, cancelSegment, saveSegment, quitSegment]);
  
  return {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu,
    saveSegment,
    cancelSegment,
    quitSegment
  };
};
