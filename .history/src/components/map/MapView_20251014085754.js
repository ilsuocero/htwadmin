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
  const { dispatch } = useAppState();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layersLoaded, setLayersLoaded] = useState({
    sentieri: false,
    destinazioni: false,
    incroci: false
  });
  const isInitialized = useRef(false);
  const retryCount = useRef(0); // Track retry attempts
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
        
        // If container still has zero dimensions after multiple retries, force dimensions
        if (retryCount.current > 10) {
          console.log('MapView: Forcing container dimensions after retry limit');
          container.style.height = '400px';
          container.style.width = '100%';
        }
        
        retryCount.current += 1;
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
  }, [dispatch]); // Include dispatch in dependencies
  
  // Clear all map event listeners
  const clearAllMapListeners = useCallback(() => {
    console.log('🎯 clearAllMapListeners');
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
      if (map.current.getSource('sentieri')) {
        console.log('🎯MapView: Setting mouse event for sentieri:', currentMode);
        map.current.on('click', 'sentieri', (e) => {
          console.log('🎯MapView: click on sentieri:', currentMode);
          // Instead of alert, dispatch to show segment info or form
          const feature = e.features?.[0];
          if (feature) {
            console.log('🎯MapView: Segment clicked:', feature.properties);
            // TODO: Implement segment info display or edit form
            // For now, show basic info
            const description = feature.properties?.Nome || 'Unnamed segment';
            alert(`Segment: ${description}\nID: ${feature.properties?.id}`);
          }
        });
        
        // Hover behavior for sentieri (segments)
        map.current.on('mouseenter', 'sentieri', (e) => {
          const featureId = e.features[0].properties.id;
          map.current.setPaintProperty('sentieri', 'line-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.PATH_OVER || '#ff0000', // Hover color
            ENV.PATH || '#ff000080' // Default color
          ]);
          map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', 'sentieri', () => {
          map.current.setPaintProperty('sentieri', 'line-color', ENV.PATH || '#ff000080');
          map.current.getCanvas().style.cursor = '';
        });
      } else {
        console.log('🎯MapView: FAILED mouse event for sentieri:', currentMode);
      }
// 
      if (map.current.getLayer('destinazioni')) {
        console.log('🎯MapView: Setting mouse event for destinazioni:', currentMode);
        if (onMapMouseDown) {
          map.current.on('mousedown', 'destinazioni', onMapMouseDown);
        }
        
        // Hover behavior for destinazioni (destinations)
        map.current.on('mouseenter', 'destinazioni', (e) => {
          const featureId = e.features[0].properties.id;
          map.current.setPaintProperty('destinazioni', 'circle-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.DESTINATION_OVER || '#00ff00', // Hover color
            ENV.DESTINATION || '#0000ff' // Default color
          ]);
          map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', 'destinazioni', () => {
          map.current.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION || '#0000ff');
          map.current.getCanvas().style.cursor = '';
        });
      } else {
        console.log('🎯MapView: FAILED mouse event for destinazioni:', currentMode);
      }
      // 
      if (map.current.getLayer('incroci')) {
        console.log('🎯MapView: Setting mouse event for incroci:', currentMode);
        if (onMapMouseDown) {
          map.current.on('mousedown', 'incroci', onMapMouseDown);
        }
        
        // Hover behavior for incroci (crossroads)
        map.current.on('mouseenter', 'incroci', (e) => {
          const featureId = e.features[0].properties.id;
          map.current.setPaintProperty('incroci', 'circle-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.CROSSROADS_OVER || '#ffff00', // Hover color
            ENV.CROSSROADS || '#ff0000' // Default color
          ]);
          map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', 'incroci', () => {
      // 
    } catch (error) {
      console.error('MapView: Error setting up normal handlers:', error);
    }
  }, [currentMode, onContextMenu, onMapMouseDown, onMapMouseMove, onMapMouseUp]);
  
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
  
  // Event handler management - only clear when mode changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    console.log('🎯MapView: Setting up event handlers for mode:', currentMode);
    console.log('🎯MapView: Available layers:', {
      sentieri: !!map.current.getLayer('sentieri'),
      destinazioni: !!map.current.getLayer('destinazioni'),
      incroci: !!map.current.getLayer('incroci')
    });
    
    // Clear existing listeners only when mode changes
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
    
    // Add fallback global click handler for debugging
    map.current.on('click', (e) => {
      console.log('🎯 Global map click - Mode:', currentMode, 'Features:', e.features?.length || 0);
      console.log('🎯 Global map click - Point:', e.lngLat);
      console.log('🎯 Global map click - Available layers:', {
        sentieri: !!map.current.getLayer('sentieri'),
        destinazioni: !!map.current.getLayer('destinazioni'),
        incroci: !!map.current.getLayer('incroci')
      });
    });
    
    
  }, [mapLoaded, currentMode, layersLoaded.sentieri, layersLoaded.destinazioni, layersLoaded.incroci]);
  
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
        
        // Track when sentieri layer is loaded
        setLayersLoaded(prev => ({ ...prev, sentieri: true }));
        console.log('🎯MapView: Sentieri layer loaded and tracked');
      } else {
        map.current.getSource('sentieri').setData(pathNetwork);
        // Ensure sentieri layer state is set
        if (!layersLoaded.sentieri) {
          setLayersLoaded(prev => ({ ...prev, sentieri: true }));
        }
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
  }, [mapLoaded, pathNetwork, layersLoaded.sentieri]);
  
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
        
        // Track when destinazioni layer is loaded
        setLayersLoaded(prev => ({ ...prev, destinazioni: true }));
        console.log('🎯MapView: Destinazioni layer loaded and tracked');
      } else {
        map.current.getSource('destinazioni').setData(destNetwork);
        // Ensure destinazioni layer state is set
        if (!layersLoaded.destinazioni) {
          setLayersLoaded(prev => ({ ...prev, destinazioni: true }));
        }
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
  }, [mapLoaded, destNetwork, layersLoaded.destinazioni]);
  
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
        
        // Track when incroci layer is loaded
        setLayersLoaded(prev => ({ ...prev, incroci: true }));
        console.log('🎯MapView: Incroci layer loaded and tracked');
      } else {
        map.current.getSource('incroci').setData(crossRoads);
        // Ensure incroci layer state is set
        if (!layersLoaded.incroci) {
          setLayersLoaded(prev => ({ ...prev, incroci: true }));
        }
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
  }, [mapLoaded, crossRoads, layersLoaded.incroci]);
  
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
