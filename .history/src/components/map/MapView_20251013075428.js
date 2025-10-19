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
  const isInitialized = useRef(false);
  const initialCenter = useRef([9.49709, 44.88096]); // Store initial center
  const initialZoom = useRef(14);
  
  // Expose map methods to parent components
  useImperativeHandle(ref, () => ({
    getMap: () => map.current,
    getMapContainer: () => mapContainer.current,
    recenter: () => {
      if (map.current) {
        map.current.flyTo({
          center: initialCenter.current,
          zoom: initialZoom.current,
          duration: 1000
        });
      }
    }
  }));
  
  // Initialize map - ONLY ONCE with proper centering
  useEffect(() => {
    if (isInitialized.current || !mapContainer.current) return;
    
    console.log('MapView: Initializing map at coordinates:', initialCenter.current);
    isInitialized.current = true;
    
    // Wait for container to be properly sized
    const initializeMap = () => {
      const container = mapContainer.current;
      if (!container) return;
      
      // Check if container has dimensions
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.log('MapView: Container not ready, retrying...');
        setTimeout(initializeMap, 100);
        return;
      }
      
      try {
        console.log('MapView: Container ready, creating map...');
        
        map.current = new maplibregl.Map({
          container: container,
          style: 'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
          center: initialCenter.current,
          zoom: initialZoom.current,
          // Disable automatic behaviors that might interfere
          trackResize: false,
          dragPan: true,
          dragRotate: false,
          scrollZoom: true,
          boxZoom: false,
          doubleClickZoom: true,
          keyboard: false,
          touchZoomRotate: false,
          // Performance settings
          preserveDrawingBuffer: false,
          antialias: false,
          // Prevent unwanted movements
          maxTileCacheSize: 50,
          transformRequest: (url, resourceType) => {
            // Don't modify tile requests
            return { url };
          }
        });
        
        // Handle map load
        map.current.on('load', () => {
          console.log('MapView: Map loaded at center:', map.current.getCenter());
          setMapLoaded(true);
          dispatch({ type: 'SET_MAP_LOADED', payload: true });
          
          // Force the map to stay at initial coordinates after loading
          setTimeout(() => {
            if (map.current) {
              const currentCenter = map.current.getCenter();
              const targetCenter = initialCenter.current;
              
              // Check if map has drifted from initial position
              const drift = Math.abs(currentCenter.lng - targetCenter[0]) + Math.abs(currentCenter.lat - targetCenter[1]);
              if (drift > 0.001) { // If drifted more than ~100m
                console.log('MapView: Correcting map drift, moving back to:', targetCenter);
                map.current.setCenter(targetCenter);
                map.current.setZoom(initialZoom.current);
              }
            }
          }, 500);
        });
        
        // Handle map errors
        map.current.on('error', (e) => {
          console.error('MapView: Map error:', e);
        });
        
        // Prevent unwanted map movements during data loading
        map.current.on('sourcedata', (e) => {
          // Don't recenter on source data changes
          if (e.sourceId && e.isSourceLoaded) {
            // Source loaded, but don't move the map
          }
        });
        
        // Log when map moves (for debugging)
        map.current.on('move', () => {
          const center = map.current.getCenter();
          console.log('MapView: Map moved to:', [center.lng, center.lat]);
        });
        
        // Prevent map from moving when layers are added
        map.current.on('styledata', (e) => {
          if (e.style) {
            // Style loaded, ensure we stay centered
            setTimeout(() => {
              if (map.current) {
                const currentCenter = map.current.getCenter();
                const targetCenter = initialCenter.current;
                const drift = Math.abs(currentCenter.lng - targetCenter[0]) + Math.abs(currentCenter.lat - targetCenter[1]);
                
                if (drift > 0.001) {
                  console.log('MapView: Correcting style-induced drift');
                  map.current.setCenter(targetCenter);
                  map.current.setZoom(initialZoom.current);
                }
              }
            }, 100);
          }
        });
        
      } catch (error) {
        console.error('MapView: Error initializing map:', error);
        isInitialized.current = false;
      }
    };
    
    // Start initialization
    initializeMap();
    
    // Cleanup function
    return () => {
      console.log('MapView: Cleaning up map...');
      
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('MapView: Error during cleanup:', error);
        }
        map.current = null;
      }
      
      isInitialized.current = false;
    };
  }, []); // Empty dependency array - initialize only once
  
  // Event handler management - stable setup
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    console.log('MapView: Setting up event handlers for mode:', currentMode);
    
    // Clear existing listeners
    clearAllMapListeners();
    
    // Set up new listeners based on mode
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
    
  }, [mapLoaded, currentMode]);
  
  // Clear all map event listeners
  const clearAllMapListeners = useCallback(() => {
    if (!map.current) return;
    
    try {
      // Clear general listeners
      map.current.off('click');
      map.current.off('contextmenu'); 
      map.current.off('mousedown');
      map.current.off('mousemove');
      map.current.off('mouseup');
      
      // Clear layer-specific listeners
      ['sentieri', 'destinazioni', 'incroci'].forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.off('click', layerId);
          map.current.off('mousedown', layerId);
          map.current.off('mouseenter', layerId);
          map.current.off('mouseleave', layerId);
        }
      });
    } catch (error) {
      console.warn('MapView: Error clearing listeners:', error);
    }
  }, []);
  
  // Normal mode handlers - simplified and stable
  const setupNormalModeHandlers = useCallback(() => {
    if (!map.current) return;
    
    try {
      // Context menu
      map.current.on('contextmenu', (e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e);
      });
      
      // Basic mouse handlers
      if (onMapMouseMove) map.current.on('mousemove', onMapMouseMove);
      if (onMapMouseUp) map.current.on('mouseup', onMapMouseUp);
      
      // Layer-specific handlers only if layers exist
      if (map.current.getLayer('sentieri')) {
        map.current.on('click', 'sentieri', (e) => {
          const description = e.features?.[0]?.properties?.Nome || 'Unnamed segment';
          alert(description);
        });
      }
      
      if (map.current.getLayer('destinazioni') && onMapMouseDown) {
        map.current.on('mousedown', 'destinazioni', onMapMouseDown);
      }
      
      if (map.current.getLayer('incroci') && onMapMouseDown) {
        map.current.on('mousedown', 'incroci', onMapMouseDown);
      }
      
    } catch (error) {
      console.error('MapView: Error setting up normal handlers:', error);
    }
  }, [onContextMenu, onMapMouseDown, onMapMouseMove, onMapMouseUp]);
  
  // Edit mode handlers
  const setupEditModeHandlers = useCallback(() => {
    if (!map.current) return;
    
    try {
      map.current.getCanvas().style.cursor = 'crosshair';
      if (onMapClick) map.current.on('click', onMapClick);
    } catch (error) {
      console.error('MapView: Error setting up edit handlers:', error);
    }
  }, [onMapClick]);
  
  // Auto-segment handlers
  const setupAutoSegmentHandlers = useCallback(() => {
    if (!map.current) return;
    
    try {
      map.current.getCanvas().style.cursor = 'crosshair';
      
      if (onMapClick) {
        if (map.current.getLayer('destinazioni')) {
          map.current.on('click', 'destinazioni', onMapClick);
        }
        if (map.current.getLayer('incroci')) {
          map.current.on('click', 'incroci', onMapClick);
        }
      }
    } catch (error) {
      console.error('MapView: Error setting up auto-segment handlers:', error);
    }
  }, [onMapClick]);
  
  // Layer management - with center preservation
  useEffect(() => {
    if (!mapLoaded || !pathNetwork || !map.current) return;
    
    try {
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      
      if (!map.current.getSource('sentieri')) {
        map.current.addSource('sentieri', {
          type: 'geojson',
          data: pathNetwork,
        });
        
        map.current.addLayer({
          id: 'sentieri',
          type: 'line',
          source: 'sentieri',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': ENV.PATH || '#ff000080',
            'line-dasharray': [2, 1.5],
            'line-width': 4,
          },
        });
      } else {
        map.current.getSource('sentieri').setData(pathNetwork);
      }
      
      // Preserve center after adding layer
      setTimeout(() => {
        if (map.current) {
          map.current.setCenter([currentCenter.lng, currentCenter.lat]);
          map.current.setZoom(currentZoom);
        }
      }, 10);
      
    } catch (error) {
      console.error('MapView: Error with path network:', error);
    }
  }, [mapLoaded, pathNetwork]);
  
  useEffect(() => {
    if (!mapLoaded || !destNetwork || !map.current) return;
    
    try {
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      
      if (!map.current.getSource('destinazioni')) {
        map.current.addSource('destinazioni', {
          type: 'geojson',
          data: destNetwork,
        });
        
        map.current.addLayer({
          id: 'destinazioni',
          type: 'circle',
          source: 'destinazioni',
          paint: {
            'circle-radius': 10,
            'circle-color': ENV.DESTINATION || '#0000ff',
            'circle-stroke-width': 1,
            'circle-stroke-color': 'black',
          },
          filter: ['==', '$type', 'Point'],
        });
      } else {
        map.current.getSource('destinazioni').setData(destNetwork);
      }
      
      // Preserve center
      setTimeout(() => {
        if (map.current) {
          map.current.setCenter([currentCenter.lng, currentCenter.lat]);
          map.current.setZoom(currentZoom);
        }
      }, 10);
      
    } catch (error) {
      console.error('MapView: Error with destinations:', error);
    }
  }, [mapLoaded, destNetwork]);
  
  useEffect(() => {
    if (!mapLoaded || !crossRoads || !map.current) return;
    
    try {
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      
      if (!map.current.getSource('incroci')) {
        map.current.addSource('incroci', {
          type: 'geojson',
          data: crossRoads,
        });
        
        map.current.addLayer({
          id: 'incroci',
          type: 'circle',
          source: 'incroci',
          paint: {
            'circle-radius': 7,
            'circle-color': ENV.CROSSROADS || '#ff0000',
            'circle-stroke-width': 1,
            'circle-stroke-color': 'black',
          },
          filter: ['==', '$type', 'Point'],
        });
      } else {
        map.current.getSource('incroci').setData(crossRoads);
      }
      
      // Preserve center
      setTimeout(() => {
        if (map.current) {
          map.current.setCenter([currentCenter.lng, currentCenter.lat]);
          map.current.setZoom(currentZoom);
        }
      }, 10);
      
    } catch (error) {
      console.error('MapView: Error with crossroads:', error);
    }
  }, [mapLoaded, crossRoads]);
  
  return (
    <div 
      ref={mapContainer} 
      className="map-container"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
});

MapView.displayName = 'MapView';

export default MapView;
