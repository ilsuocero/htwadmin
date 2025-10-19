import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useEditModeManager = (mapRef) => {
  const { state, dispatch } = useAppState();
  
  // Father state - manages ALL edit mode state
  const [currentMode, setCurrentMode] = useState('NORMAL');
  const [publicCurrentMode, setPublicCurrentMode] = useState('NORMAL');
  
  // All edit mode state management here
  const isFirstClickRef = useRef(true);
  const tempPointsRef = useRef([]);
  
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
  
  const handleEditModeClick = useCallback((e) => {
    console.log('🎯 EDIT MODE MANAGER: Edit mode click at:', e.lngLat);
    console.log('🎯 EDIT MODE MANAGER: Click features:', e.features?.length || 0);
    
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    const clickedFeatures = e.features || [];
    
    if (clickedFeatures.length > 0) {
      // We clicked on a feature (crossroad/destination)
      const feature = clickedFeatures[0];
      const layerId = feature.source;
      
      if (layerId === 'destinazioni' || layerId === 'incroci') {
        const featureId = feature.properties.id;
        const clickedCoordinates = feature.geometry.coordinates;
        console.log('🎯 EDIT MODE MANAGER: Clicking on feature:', featureId, clickedCoordinates);
        
        // Store the snap coordinates
        if (isFirstClickRef.current) {
          console.log('🎯 EDIT MODE MANAGER: First snap to feature');
          dispatch({ 
            type: 'SET_EDIT_MODE_SNAP1', 
            payload: { clickedCoords: clickedCoordinates, featureId, featureType: layerId } 
          });
          isFirstClickRef.current = false;
        } else {
          console.log('🎯 EDIT MODE MANAGER: Second snap to feature');
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
