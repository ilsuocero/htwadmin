import React, { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useStateTracker } from './useStateTracker';

export const useSimpleMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  // Simple refs to track segment creation state
  const tempPointsRef = useRef([]);
  const isFirstClickRef = useRef(true);
  
  // Track state changes
  useStateTracker('useSimpleMapBehavior', {
    currentMode,
    tempPointsCount: tempPointsRef.current.length,
    isFirstClick: isFirstClickRef.current,
    editModeState: state.editMode
  });

  const handleEditModeClick = useCallback((e) => {
    console.log('🚀 SIMPLE: Edit mode click at:', e.lngLat);
    console.log('🚀 SIMPLE: Click features:', e.features?.length || 0);
    
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // SIMPLE APPROACH: Check if we have features in the click event
    const clickedFeatures = e.features || [];
    
    if (clickedFeatures.length > 0) {
      // We clicked on a feature (crossroad/destination)
      const feature = clickedFeatures[0];
      const layerId = feature.source;
      
      if (layerId === 'destinazioni' || layerId === 'incroci') {
        const featureId = feature.properties.id;
        const clickedCoordinates = feature.geometry.coordinates;
        console.log('🚀 SIMPLE: Clicking on feature:', featureId, clickedCoordinates);
        
        // Store the snap coordinates
        if (isFirstClickRef.current) {
          console.log('🚀 SIMPLE: First snap to feature');
          dispatch({ 
            type: 'SET_EDIT_MODE_SNAP1', 
            payload: { clickedCoords: clickedCoordinates, featureId, featureType: layerId } 
          });
          isFirstClickRef.current = false;
        } else {
          console.log('🚀 SIMPLE: Second snap to feature');
          dispatch({ 
            type: 'SET_EDIT_MODE_SNAP2', 
            payload: { clickedCoords: clickedCoordinates, featureId, featureType: layerId } 
          });
          
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
    
  }, [mapRef, dispatch]);

  const updateTemporarySources = (map, points) => {
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
  };

  const handleMapClick = useCallback((e) => {
    console.log('🚀 SIMPLE: Map clicked in mode:', currentMode);
    
    switch (currentMode) {
      case 'EDIT':
        handleEditModeClick(e);
        break;
      default:
        console.log('🚀 SIMPLE: No action for mode:', currentMode);
        break;
    }
  }, [currentMode, handleEditModeClick]);

  const handleContextMenu = useCallback((e) => {
    console.log('🚀 SIMPLE: Context menu triggered in mode:', currentMode);
    console.log('🚀 SIMPLE: Context menu event details:', {
      point: e.point,
      lngLat: e.lngLat,
      features: e.features?.length || 0
    });
    
    if (currentMode === 'NORMAL') {
      e.preventDefault();
      console.log('🚀 SIMPLE: Dispatching SHOW_CONTEXT_MENU with payload:', {
        position: { x: e.point.x, y: e.point.y },
        coordinates: e.lngLat 
      });
      dispatch({ 
        type: 'SHOW_CONTEXT_MENU', 
        payload: { 
          position: { x: e.point.x, y: e.point.y },
          coordinates: e.lngLat 
        }
      });
    } else {
      console.log('🚀 SIMPLE: Context menu ignored - not in NORMAL mode');
    }
  }, [currentMode, dispatch]);

  // ESC key handler for edit mode cancellation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && currentMode === 'EDIT') {
        console.log('🚀 SIMPLE: ESC key pressed in edit mode');
        e.preventDefault();
        cancelEditing();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMode, cancelEditing]);

  // Reset state when entering edit mode
  React.useEffect(() => {
    if (currentMode === 'EDIT') {
      console.log('🚀 SIMPLE: Entering edit mode - resetting state');
      tempPointsRef.current = [];
      isFirstClickRef.current = true;
      
      const map = mapRef.current?.getMap();
      if (map) {
        initializeTemporarySources(map);
        map.getCanvas().style.cursor = 'crosshair';
      }
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

  const cancelEditing = useCallback(() => {
    console.log('🚀 SIMPLE: Canceling edit mode');
    
    const map = mapRef.current?.getMap();
    if (map) {
      console.log('🚀 SIMPLE: Cleaning up temporary features from map');
      
      // Clean up temporary sources and layers
      if (map.getLayer('tempLineLayer')) {
        console.log('🚀 SIMPLE: Removing tempLineLayer');
        map.removeLayer('tempLineLayer');
      } else {
        console.log('🚀 SIMPLE: tempLineLayer not found');
      }
      
      if (map.getLayer('tempPointLayer')) {
        console.log('🚀 SIMPLE: Removing tempPointLayer');
        map.removeLayer('tempPointLayer');
      } else {
        console.log('🚀 SIMPLE: tempPointLayer not found');
      }
      
      if (map.getSource('tempLineSource')) {
        console.log('🚀 SIMPLE: Removing tempLineSource');
        map.removeSource('tempLineSource');
      } else {
        console.log('🚀 SIMPLE: tempLineSource not found');
      }
      
      if (map.getSource('tempPointSource')) {
        console.log('🚀 SIMPLE: Removing tempPointSource');
        map.removeSource('tempPointSource');
      } else {
        console.log('🚀 SIMPLE: tempPointSource not found');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      console.log('🚀 SIMPLE: Cursor reset to default');
    } else {
      console.log('🚀 SIMPLE: Map not available for cleanup');
    }
    
    // Reset state
    tempPointsRef.current = [];
    isFirstClickRef.current = true;
    console.log('🚀 SIMPLE: State reset - tempPoints:', tempPointsRef.current.length, 'isFirstClick:', isFirstClickRef.current);
    
    // Exit edit mode
    console.log('🚀 SIMPLE: Dispatching SET_MAP_MODE to NORMAL');
    dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
  }, [mapRef, dispatch]);

  return {
    handleMapClick,
    handleContextMenu,
    cancelEditing,
    // Simple handlers for other events
    handleMapMouseDown: () => {},
    handleMapMouseMove: () => {},
    handleMapMouseUp: () => {},
  };
};
