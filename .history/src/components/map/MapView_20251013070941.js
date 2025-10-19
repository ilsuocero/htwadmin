// src/components/map/MapView.js
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import './map.css';
import ENV from '../../ENV';
import { useAppState } from '../../context/AppStateContext';

export const MapView = forwardRef(({
  pathNetwork,
  destNetwork,
  crossRoads,
  onMapClick,
  onMapMouseDown,
  onMapMouseMove,
  onMapMouseUp,
  onContextMenu,
  currentMode
}, ref) => {
  const { state, dispatch } = useAppState();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Map initialization coordinates (from your original)
  const [lng] = useState(9.49709);
  const [lat] = useState(44.88096);
  const [zoom] = useState(14);
  
  // Expose map methods to parent components
  useImperativeHandle(ref, () => ({
    getMap: () => map.current,
    getMapContainer: () => mapContainer.current
  }));
  
  // Initialize map
  useEffect(() => {
    if (!map.current && !mapLoaded) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
        center: [lng, lat],
        zoom: zoom,
      });
      
      map.current.on('load', () => {
        console.log('MapView: Map loaded');
        setMapLoaded(true);
        dispatch({ type: 'SET_MAP_LOADED', payload: true });
      });
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Event handler management - clean approach
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    console.log('MapView: Setting up event handlers for mode:', currentMode);
    
    // Clear all existing listeners first
    clearAllMapListeners();
    
    // Set up event handlers based on current mode
    switch (currentMode) {
      case 'NORMAL':
        setupNormalModeHandlers();
        break;
      case 'EDIT':
        setupEditModeHandlers();
        break;
      case 'AUTO_SEGMENT':
        setupAutoSegmentHandlers();
        break;
      default:
        setupNormalModeHandlers();
    }
    
    // Cleanup function
    return () => {
      clearAllMapListeners();
    };
