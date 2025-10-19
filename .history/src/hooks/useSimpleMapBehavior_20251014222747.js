import React, { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useStateTracker } from './useStateTracker';

export const useSimpleMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  // Simple refs to track segment creation state
  const tempPointsRef = useRef([]);
  const isFirstClickRef = useRef(true);

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
    if (currentMode === 'NORMAL') {
      e.preventDefault();
      dispatch({ 
        type: 'SHOW_CONTEXT_MENU', 
        payload: { 
          position: { x: e.point.x, y: e.point.y },
          coordinates: e.lngLat 
        }
      });
    }
  }, [currentMode, dispatch]);

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

  const cancelEditing = useCallback(() => {
    console.log('🚀 SIMPLE: Canceling edit mode');
    
    const map = mapRef.current?.getMap();
    if (map) {
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
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
    }
    
    // Reset state
    tempPointsRef.current = [];
    isFirstClickRef.current = true;
    
    // Exit edit mode
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
