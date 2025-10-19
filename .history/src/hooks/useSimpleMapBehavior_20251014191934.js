import React, { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';

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
