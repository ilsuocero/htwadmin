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
        style: 'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
        center: [9.49709, 44.88096],
        zoom: 14,
      });

      newMap.on('load', () => {
        setMapLoaded(true);
        setMap(newMap);
      });

      // Set up event listeners
      newMap.on('click', onMapClick);
      newMap.on('mousedown', onMapMouseDown);
      newMap.on('mousemove', onMapMouseMove);
      newMap.on('mouseup', onMapMouseUp);
      newMap.on('contextmenu', onContextMenu);

      // Expose map instance via ref
      if (ref) {
        ref.current = newMap;
      }
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
