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
  }, [map, ref, onMapClick, onMapMouseDown, onMapMouseMove, onMapMouseUp, onContextMenu]);

  // Add path network layer
  useEffect(() => {
    if (map && mapLoaded && pathNetwork) {
      if (!map.getSource('sentieri')) {
        map.addSource('sentieri', {
          type: 'geojson',
          data: pathNetwork,
        });

        map.addLayer({
          id: 'sentieri',
          type: 'line',
          source: 'sentieri',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ff000080',
            'line-dasharray': [2, 1.5],
            'line-width': 4,
          },
        });
      } else {
        map.getSource('sentieri').setData(pathNetwork);
      }
    }
  }, [map, mapLoaded, pathNetwork]);

  // Add destinations layer
  useEffect(() => {
    if (map && mapLoaded && destNetwork) {
      if (!map.getSource('destinazioni')) {
        map.addSource('destinazioni', {
          type: 'geojson',
          data: destNetwork,
        });

        map.addLayer({
          id: 'destinazioni',
          type: 'circle',
          source: 'destinazioni',
          paint: {
            'circle-radius': 10,
            'circle-color': '#ff6b6b',
            'circle-stroke-width': 1,
            'circle-stroke-color': 'black',
            'circle-pitch-scale': 'viewport',
          },
        });
      } else {
        map.getSource('destinazioni').setData(destNetwork);
      }
    }
  }, [map, mapLoaded, destNetwork]);

  // Add crossroads layer
  useEffect(() => {
    if (map && mapLoaded && crossRoads) {
      if (!map.getSource('incroci')) {
        map.addSource('incroci', {
          type: 'geojson',
          data: crossRoads,
        });

        map.addLayer({
          id: 'incroci',
          type: 'circle',
          source: 'incroci',
          paint: {
            'circle-radius': 7,
            'circle-color': '#4ecdc4',
            'circle-stroke-width': 1,
            'circle-stroke-color': 'black',
            'circle-pitch-scale': 'viewport',
          },
        });
      } else {
        map.getSource('incroci').setData(crossRoads);
      }
    }
  }, [map, mapLoaded, crossRoads]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
