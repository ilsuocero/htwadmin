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
