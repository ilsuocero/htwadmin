// src/components/map/MapView.js
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import './map.css';
import ENV from '../../ENV';
import { useAppState } from '../../context/AppStateContext';

// Suppress ResizeObserver errors in development
const suppressResizeObserverError = () => {
  const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
  const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
  if (resizeObserverErr) {
    resizeObserverErr.setAttribute('style', 'display: none');
  }
  if (resizeObserverErrDiv) {
    resizeObserverErrDiv.setAttribute('style', 'display: none');
  }
};

// Override console.error to filter ResizeObserver errors
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
      return; // Suppress ResizeObserver errors
    }
    originalError(...args);
  };
}

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
  const initializationRef = useRef(false);
  
  // Map initialization coordinates (from your original)
  const [lng] = useState(9.49709);
  const [lat] = useState(44.88096);
  const [zoom] = useState(14);
  
  // Expose map methods to parent components
  useImperativeHandle(ref, () => ({
    getMap: () => map.current,
    getMapContainer: () => mapContainer.current
  }));
  
  // Initialize map - with better error handling
  useEffect(() => {
    if (initializationRef.current || !mapContainer.current) return;
    
    try {
      console.log('MapView: Initializing map...');
      initializationRef.current = true;
      
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
        center: [lng, lat],
        zoom: zoom,
        preserveDrawingBuffer: true, // Helps with some rendering issues
        antialias: true
      });
      
      map.current.on('load', () => {
        console.log('MapView: Map loaded successfully');
        setMapLoaded(true);
        dispatch({ type: 'SET_MAP_LOADED', payload: true });
        
        // Suppress ResizeObserver errors after map loads
        setTimeout(suppressResizeObserverError, 100);
      });
      
      map.current.on('error', (e) => {
        console.error('MapView: Map error:', e);
      });
      
      // Handle resize events properly
      map.current.on('resize', () => {
        // Suppress ResizeObserver errors on resize
        setTimeout(suppressResizeObserverError, 50);
      });
      
    } catch (error) {
      console.error('MapView: Error initializing map:', error);
      initializationRef.current = false;
    }
    
    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('MapView: Error removing map:', error);
        }
        map.current = null;
      }
      initializationRef.current = false;
    };
  }, [lng, lat, zoom, dispatch]);
  
  // Event handler management - clean approach with error handling
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    console.log('MapView: Setting up event handlers for mode:', currentMode);
    
    try {
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
    } catch (error) {
      console.error('MapView: Error setting up event handlers:', error);
    }
    
    // Cleanup function
    return () => {
      try {
        clearAllMapListeners();
      } catch (error) {
        console.warn('MapView: Error cleaning up event handlers:', error);
      }
    };
  }, [mapLoaded, currentMode]);
  
  // Clear all map event listeners - with error handling
  const clearAllMapListeners = useCallback(() => {
    if (!map.current) return;
    
    try {
      console.log('MapView: Clearing all map listeners');
      
      // Remove general event listeners
      map.current.off('click');
      map.current.off('contextmenu');
      map.current.off('mousedown');
      map.current.off('mousemove');
      map.current.off('mouseup');
      
      // Remove layer-specific listeners only if layers exist
      const layers = ['sentieri', 'destinazioni', 'incroci'];
      layers.forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.off('click', layerId);
          map.current.off('mousedown', layerId);
          map.current.off('mouseenter', layerId);
          map.current.off('mouseleave', layerId);
        }
      });
    } catch (error) {
      console.warn('MapView: Error clearing map listeners:', error);
    }
  }, []);
  
  // Normal mode event handlers
  const setupNormalModeHandlers = useCallback(() => {
    if (!map.current) return;
    
    try {
      console.log('MapView: Setting up normal mode handlers');
      
      // Context menu for creating new features
      map.current.on('contextmenu', (e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e);
      });
      
      // Set up segment interactions if layer exists
      if (map.current.getLayer('sentieri')) {
        map.current.on('click', 'sentieri', (e) => {
          if (e.features && e.features[0]) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.Nome || 'Unnamed segment';
            alert(description); // Replace with proper modal later
          }
        });
        
        // Segment hover effects
        map.current.on('mouseenter', 'sentieri', (e) => {
          if (e.features && e.features[0]) {
            const featureId = e.features[0].properties.id;
            if (featureId) {
              map.current.setPaintProperty('sentieri', 'line-color', [
                'case',
                ['==', ['get', 'id'], featureId],
                ENV.PATH_OVER || '#ff6600',
                ENV.PATH || '#ff000080',
              ]);
            }
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.current.on('mouseleave', 'sentieri', () => {
          map.current.setPaintProperty('sentieri', 'line-color', ENV.PATH || '#ff000080');
          map.current.getCanvas().style.cursor = '';
        });
      }
      
      // Set up destination interactions if layer exists
      if (map.current.getLayer('destinazioni')) {
        map.current.on('mousedown', 'destinazioni', (e) => {
          if (onMapMouseDown) onMapMouseDown(e);
        });
        
        map.current.on('mouseenter', 'destinazioni', (e) => {
          if (e.features && e.features[0]) {
            const featureId = e.features[0].properties.id;
            if (featureId) {
              map.current.setPaintProperty('destinazioni', 'circle-color', [
                'case',
                ['==', ['get', 'id'], featureId],
                ENV.DESTINATION_OVER || '#0066ff',
                ENV.DESTINATION || '#0000ff',
              ]);
            }
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.current.on('mouseleave', 'destinazioni', () => {
          map.current.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION || '#0000ff');
          map.current.getCanvas().style.cursor = '';
        });
      }
      
      // Set up crossroad interactions if layer exists
      if (map.current.getLayer('incroci')) {
        map.current.on('mousedown', 'incroci', (e) => {
          if (onMapMouseDown) onMapMouseDown(e);
        });
        
        map.current.on('mouseenter', 'incroci', (e) => {
          if (e.features && e.features[0]) {
            const featureId = e.features[0].properties.id;
            if (featureId) {
              map.current.setPaintProperty('incroci', 'circle-color', [
                'case',
                ['==', ['get', 'id'], featureId],
                ENV.CROSSROADS_OVER || '#ff6600',
                ENV.CROSSROADS || '#ff0000',
              ]);
            }
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.current.on('mouseleave', 'incroci', () => {
          map.current.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS || '#ff0000');
          map.current.getCanvas().style.cursor = '';
        });
      }
      
      // Global mouse handlers
      map.current.on('mousemove', (e) => {
        if (onMapMouseMove) onMapMouseMove(e);
      });
      
      map.current.on('mouseup', (e) => {
        if (onMapMouseUp) onMapMouseUp(e);
      });
      
    } catch (error) {
      console.error('MapView: Error setting up normal mode handlers:', error);
    }
  }, [onContextMenu, onMapMouseDown, onMapMouseMove, onMapMouseUp]);
  
  // Edit mode event handlers
  const setupEditModeHandlers = useCallback(() => {
    if (!map.current) return;
    
    try {
      console.log('MapView: Setting up edit mode handlers');
      
      // Set crosshair cursor for edit mode
      map.current.getCanvas().style.cursor = 'crosshair';
      
      // Map click for adding points
      map.current.on('click', (e) => {
        if (onMapClick) onMapClick(e);
      });
      
      // Keep hover effects for snap functionality in edit mode
      if (map.current.getLayer('destinazioni')) {
        map.current.on('mouseenter', 'destinazioni', (e) => {
          if (e.features && e.features[0]) {
            const featureId = e.features[0].properties.id;
            if (featureId) {
              map.current.setPaintProperty('destinazioni', 'circle-color', [
                'case',
                ['==', ['get', 'id'], featureId],
                ENV.DESTINATION_OVER || '#0066ff',
                ENV.DESTINATION || '#0000ff',
              ]);
            }
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.current.on('mouseleave', 'destinazioni', () => {
          map.current.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION || '#0000ff');
          map.current.getCanvas().style.cursor = 'crosshair';
        });
      }
      
      if (map.current.getLayer('incroci')) {
        map.current.on('mouseenter', 'incroci', (e) => {
          if (e.features && e.features[0]) {
            const featureId = e.features[0].properties.id;
            if (featureId) {
              map.current.setPaintProperty('incroci', 'circle-color', [
                'case',
                ['==', ['get', 'id'], featureId],
                ENV.CROSSROADS_OVER || '#ff6600',
                ENV.CROSSROADS || '#ff0000',
              ]);
            }
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.current.on('mouseleave', 'incroci', () => {
          map.current.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS || '#ff0000');
          map.current.getCanvas().style.cursor = 'crosshair';
        });
      }
    } catch (error) {
      console.error('MapView: Error setting up edit mode handlers:', error);
    }
  }, [onMapClick]);
  
  // Auto-segment mode event handlers
  const setupAutoSegmentHandlers = useCallback(() => {
    if (!map.current) return;
    
    try {
      console.log('MapView: Setting up auto-segment mode handlers');
      
      // Set crosshair cursor
      map.current.getCanvas().style.cursor = 'crosshair';
      
      // Click handlers for crossroad selection
      if (map.current.getLayer('destinazioni')) {
        map.current.on('click', 'destinazioni', (e) => {
          if (onMapClick) onMapClick(e);
        });
      }
      
      if (map.current.getLayer('incroci')) {
        map.current.on('click', 'incroci', (e) => {
          if (onMapClick) onMapClick(e);
        });
      }
      
      // Update colors to show selection state
      updateAutoSegmentColors();
    } catch (error) {
      console.error('MapView: Error setting up auto-segment handlers:', error);
    }
  }, [onMapClick]);
  
  // Update colors for auto-segment mode
  const updateAutoSegmentColors = useCallback(() => {
    if (!map.current || !state.autoSegment?.selectedCrossroads) return;
    
    try {
      const selectedIds = state.autoSegment.selectedCrossroads.map(
        crossroad => crossroad.properties?.id
      ).filter(id => id); // Filter out undefined IDs
      
      // Update incroci layer
      if (map.current.getLayer('incroci') && selectedIds.length > 0) {
        map.current.setPaintProperty('incroci', 'circle-color', [
          'case',
          ['in', ['get', 'id'], ['literal', selectedIds]],
          ENV.CROSSROADS_SELECTED || '#ff0000',
          ENV.CROSSROADS || '#ff0000',
        ]);
      }
      
      // Update destinazioni layer
      if (map.current.getLayer('destinazioni') && selectedIds.length > 0) {
        map.current.setPaintProperty('destinazioni', 'circle-color', [
          'case',
          ['in', ['get', 'id'], ['literal', selectedIds]],
          ENV.CROSSROADS_SELECTED || '#ff0000',
          ENV.DESTINATION || '#0000ff',
        ]);
      }
    } catch (error) {
      console.error('MapView: Error updating auto-segment colors:', error);
    }
  }, [state.autoSegment?.selectedCrossroads]);
  
  // Update auto-segment colors when selection changes
  useEffect(() => {
    if (currentMode === 'AUTO_SEGMENT') {
      updateAutoSegmentColors();
    }
  }, [currentMode, state.autoSegment?.selectedCrossroads, updateAutoSegmentColors]);
  
  // Path network layer management
  useEffect(() => {
    if (!mapLoaded || !pathNetwork || !map.current) return;
    
    try {
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
    } catch (error) {
      console.error('MapView: Error managing path network layer:', error);
    }
  }, [mapLoaded, pathNetwork]);
  
  // Destinations layer management
  useEffect(() => {
    if (!mapLoaded || !destNetwork || !map.current) return;
    
    try {
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
            'circle-pitch-scale': 'viewport',
          },
          filter: ['==', '$type', 'Point'],
        });
      } else {
        map.current.getSource('destinazioni').setData(destNetwork);
      }
    } catch (error) {
      console.error('MapView: Error managing destinations layer:', error);
    }
  }, [mapLoaded, destNetwork]);
  
  // Crossroads layer management
  useEffect(() => {
    if (!mapLoaded || !crossRoads || !map.current) return;
    
    try {
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
            'circle-pitch-scale': 'viewport',
          },
          filter: ['==', '$type', 'Point'],
        });
      } else {
        map.current.getSource('incroci').setData(crossRoads);
      }
    } catch (error) {
      console.error('MapView: Error managing crossroads layer:', error);
    }
  }, [mapLoaded, crossRoads]);
  
  // Temporary layer management for auto-segment mode
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    try {
      if (state.autoSegment?.tempRoute) {
        // Show temporary route
        if (map.current.getLayer('tempAutoSegmentLayer')) {
          map.current.removeLayer('tempAutoSegmentLayer');
        }
        if (map.current.getSource('tempAutoSegmentSource')) {
          map.current.removeSource('tempAutoSegmentSource');
        }
        
        map.current.addSource('tempAutoSegmentSource', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: state.autoSegment.tempRoute
            },
            properties: {}
          }
        });
        
        map.current.addLayer({
          id: 'tempAutoSegmentLayer',
          type: 'line',
          source: 'tempAutoSegmentSource',
          paint: {
            'line-color': '#00ff00',
            'line-width': 3,
            'line-opacity': 0.7
          }
        });
      } else {
        // Remove temporary route
        if (map.current.getLayer('tempAutoSegmentLayer')) {
          map.current.removeLayer('tempAutoSegmentLayer');
        }
        if (map.current.getSource('tempAutoSegmentSource')) {
          map.current.removeSource('tempAutoSegmentSource');
        }
      }
    } catch (error) {
      console.error('MapView: Error managing temporary layers:', error);
    }
  }, [mapLoaded, state.autoSegment?.tempRoute]);
  
  // Suppress ResizeObserver errors periodically in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(suppressResizeObserverError, 1000);
      return () => clearInterval(interval);
    }
  }, []);
  
  return (
    <div 
      ref={mapContainer} 
      className="map-container"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    />
  );
});

MapView.displayName = 'MapView';

export default MapView;
