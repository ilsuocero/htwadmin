import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import ENV from '../ENV';

export const useEditModeManager = (mapRef) => {
  const { state, dispatch } = useAppState();
  
  // Father state - manages ALL edit mode state AND ALL event handlers
  const [currentMode, setCurrentMode] = useState('NORMAL');
  const [publicCurrentMode, setPublicCurrentMode] = useState('NORMAL');
  
  // Core edit mode functions defined before event handlers to fix hoisting
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
    
  }, [dispatch, state.editMode.snap1, state.editMode.snap2, updateTemporarySources]);

  // All event handlers defined after core functions to fix hoisting issues
  const handleMapClick = useCallback((e) => {
    console.log('🎯 EDIT MODE MANAGER: Map clicked in mode:', publicCurrentMode);
    
    switch (publicCurrentMode) {
      case 'EDIT':
        handleEditModeClick(e);
        break;
      default:
        console.log('🎯 EDIT MODE MANAGER: No action for mode:', publicCurrentMode);
        break;
    }
  }, [publicCurrentMode, handleEditModeClick]);

  const handleContextMenu = useCallback((e) => {
    console.log('🎯 EDIT MODE MANAGER: Context menu triggered in mode:', publicCurrentMode);
    console.log('🎯 EDIT MODE MANAGER: Context menu event details:', {
      point: e.point,
      lngLat: e.lngLat,
      features: e.features?.length || 0
    });
    
    if (publicCurrentMode === 'NORMAL') {
      e.preventDefault();
      console.log('🎯 EDIT MODE MANAGER: Dispatching SHOW_CONTEXT_MENU with payload:', {
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
      console.log('🎯 EDIT MODE MANAGER: Context menu ignored - not in NORMAL mode');
    }
  }, [publicCurrentMode, dispatch]);

  // Simple handlers for other events (can be enhanced as needed)
  const handleMapMouseDown = useCallback(() => {}, []);
  const handleMapMouseMove = useCallback(() => {}, []);
  const handleMapMouseUp = useCallback(() => {}, []);

  // Hover handlers for sentieri (paths) in NORMAL mode
  const mouseEnterSentieri = useCallback((e) => {
    console.log('🎯 EDIT MODE MANAGER: Mouse enter sentieri');
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Get the ID of the feature under the mouse cursor
    const featureId = e.features[0].properties.id;

    // Update the color of the specific feature
    map.setPaintProperty('sentieri', 'line-color', [
      'case',
      ['==', ['get', 'id'], featureId],
      ENV.PATH_OVER, // New color for the specific feature
      ENV.PATH, // Default color for other features
    ]);

    map.getCanvas().style.cursor = 'pointer';
  }, []);

  const mouseLeaveSentieri = useCallback(() => {
    console.log('🎯 EDIT MODE MANAGER: Mouse leave sentieri');
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Reset the line color on mouseleave
    map.setPaintProperty('sentieri', 'line-color', ENV.PATH);
    map.getCanvas().style.cursor = '';
  }, []);
  
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
  
  // Track layer availability - father state monitors ALL layers
  const [layersAvailable, setLayersAvailable] = useState({
    sentieri: false,
    destinazioni: false,
    incroci: false
  });
  
  // Track pending mode setup - when currentMode changes but layers aren't available yet
  const [pendingModeSetup, setPendingModeSetup] = useState(false);
  
  // Sync with global state
  useEffect(() => {
    console.log('🔍 EDIT MODE MANAGER: Global state mode changed to:', state.map.mode);
    setCurrentMode(state.map.mode);
  }, [state.map.mode]);
  
  // Monitor layer availability - father state knows when ALL layers are ready
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
