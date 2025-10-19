import React, { forwardRef, useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import '../map.css';

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
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!map && mapContainer.current) {
      const newMap = new maplibregl.Map({
        container: mapContainer.current,
