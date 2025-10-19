// src/components/map/MapView.js
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import '../map.css';
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
  }, [mapLoaded, currentMode, onMapClick, onMapMouseDown, onMapMouseMove, onMapMouseUp, onContextMenu]);
  
  // Clear all map event listeners
  const clearAllMapListeners = useCallback(() => {
    if (!map.current) return;
    
    console.log('MapView: Clearing all map listeners');
    
    // Remove all possible event listeners
    map.current.off('click');
    map.current.off('contextmenu');
    map.current.off('mousedown');
    map.current.off('mousemove');
    map.current.off('mouseup');
    map.current.off('mouseenter');
    map.current.off('mouseleave');
    
    // Remove layer-specific listeners
    if (map.current.getLayer('sentieri')) {
      map.current.off('click', 'sentieri');
      map.current.off('mouseenter', 'sentieri');
      map.current.off('mouseleave', 'sentieri');
    }
    
    if (map.current.getLayer('destinazioni')) {
      map.current.off('click', 'destinazioni');
      map.current.off('mousedown', 'destinazioni');
      map.current.off('mouseenter', 'destinazioni');
      map.current.off('mouseleave', 'destinazioni');
    }
    
    if (map.current.getLayer('incroci')) {
      map.current.off('click', 'incroci');
      map.current.off('mousedown', 'incroci');
      map.current.off('mouseenter', 'incroci');
      map.current.off('mouseleave', 'incroci');
    }
  }, []);
  
  // Normal mode event handlers
  const setupNormalModeHandlers = useCallback(() => {
    if (!map.current) return;
    
    console.log('MapView: Setting up normal mode handlers');
    
    // Context menu for creating new features
    map.current.on('contextmenu', (e) => {
      e.preventDefault();
      if (onContextMenu) onContextMenu(e);
    });
    
    // Segment click handler
    if (map.current.getLayer('sentieri')) {
      map.current.on('click', 'sentieri', (e) => {
        const coordinates = e.features.geometry.coordinates.slice();
        const description = e.features.properties.Nome;
        alert(description); // Replace with proper modal later
      });
      
      // Segment hover effects
      map.current.on('mouseenter', 'sentieri', (e) => {
        const featureId = e.features.properties.id;
        map.current.setPaintProperty('sentieri', 'line-color', [
          'case',
          ['==', ['get', 'id'], featureId],
          ENV.PATH_OVER,
          ENV.PATH,
        ]);
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'sentieri', () => {
        map.current.setPaintProperty('sentieri', 'line-color', ENV.PATH);
        map.current.getCanvas().style.cursor = '';
      });
    }
    
    // Point interaction handlers for destinations
    if (map.current.getLayer('destinazioni')) {
      map.current.on('mousedown', 'destinazioni', (e) => {
        if (onMapMouseDown) onMapMouseDown(e);
      });
      
      map.current.on('mouseenter', 'destinazioni', (e) => {
        const featureId = e.features.properties.id;
        map.current.setPaintProperty('destinazioni', 'circle-color', [
          'case',
          ['==', ['get', 'id'], featureId],
          ENV.DESTINATION_OVER,
          ENV.DESTINATION,
        ]);
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'destinazioni', () => {
        map.current.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION);
        map.current.getCanvas().style.cursor = '';
      });
    }
    
    // Point interaction handlers for crossroads
    if (map.current.getLayer('incroci')) {
      map.current.on('mousedown', 'incroci', (e) => {
        if (onMapMouseDown) onMapMouseDown(e);
      });
      
      map.current.on('mouseenter', 'incroci', (e) => {
        const featureId = e.features.properties.id;
        map.current.setPaintProperty('incroci', 'circle-color', [
          'case',
          ['==', ['get', 'id'], featureId],
          ENV.CROSSROADS_OVER,
          ENV.CROSSROADS,
        ]);
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'incroci', () => {
        map.current.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS);
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
  }, [onContextMenu, onMapMouseDown, onMapMouseMove, onMapMouseUp]);
  
  // Edit mode event handlers
  const setupEditModeHandlers = useCallback(() => {
    if (!map.current) return;
    
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
        const featureId = e.features.properties.id;
        map.current.setPaintProperty('destinazioni', 'circle-color', [
          'case',
          ['==', ['get', 'id'], featureId],
          ENV.DESTINATION_OVER,
          ENV.DESTINATION,
        ]);
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'destinazioni', () => {
        map.current.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION);
        map.current.getCanvas().style.cursor = 'crosshair';
      });
    }
    
    if (map.current.getLayer('incroci')) {
      map.current.on('mouseenter', 'incroci', (e) => {
        const featureId = e.features.properties.id;
        map.current.setPaintProperty('incroci', 'circle-color', [
          'case',
          ['==', ['get', 'id'], featureId],
          ENV.CROSSROADS_OVER,
          ENV.CROSSROADS,
        ]);
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'incroci', () => {
        map.current.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS);
        map.current.getCanvas().style.cursor = 'crosshair';
      });
    }
  }, [onMapClick]);
  
  // Auto-segment mode event handlers
  const setupAutoSegmentHandlers = useCallback(() => {
    if (!map.current) return;
    
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
  }, [onMapClick]);
  
  // Update colors for auto-segment mode
  const updateAutoSegmentColors = useCallback(() => {
    if (!map.current || !state.autoSegment.selectedCrossroads) return;
    
    const selectedIds = state.autoSegment.selectedCrossroads.map(
      crossroad => crossroad.properties.id
    );
    
    // Update incroci layer
    if (map.current.getLayer('incroci')) {
      map.current.setPaintProperty('incroci', 'circle-color', [
        'case',
        ['in', ['get', 'id'], ['literal', selectedIds]],
        ENV.CROSSROADS_SELECTED || '#ff0000', // Red for selected
        ENV.CROSSROADS,
      ]);
    }
    
    // Update destinazioni layer
    if (map.current.getLayer('destinazioni')) {
      map.current.setPaintProperty('destinazioni', 'circle-color', [
        'case',
        ['in', ['get', 'id'], ['literal', selectedIds]],
        ENV.CROSSROADS_SELECTED || '#ff0000', // Red for selected
        ENV.DESTINATION,
      ]);
    }
  }, [state.autoSegment.selectedCrossroads]);
  
  // Update auto-segment colors when selection changes
  useEffect(() => {
    if (currentMode === 'AUTO_SEGMENT') {
      updateAutoSegmentColors();
    }
  }, [currentMode, state.autoSegment.selectedCrossroads, updateAutoSegmentColors]);
  
  // Path network layer management
  useEffect(() => {
    if (mapLoaded && pathNetwork != null) {
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
    }
  }, [mapLoaded, pathNetwork]);
  
  // Destinations layer management
  useEffect(() => {
    if (mapLoaded && destNetwork != null) {
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
    }
  }, [mapLoaded, destNetwork]);
  
  // Crossroads layer management
  useEffect(() => {
    if (mapLoaded && crossRoads != null) {
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
    }
  }, [mapLoaded, crossRoads]);
  
  // Temporary layer management for auto-segment mode
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    if (state.autoSegment.tempRoute) {
      // Show temporary route
      if (map.current.getSource('tempAutoSegmentSource')) {
        map.current.removeSource('tempAutoSegmentSource');
      }
      
      if (map.current.getLayer('tempAutoSegmentLayer')) {
        map.current.removeLayer('tempAutoSegmentLayer');
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
  }, [mapLoaded, state.autoSegment.tempRoute]);
  
  return (
    <div 
      ref={mapContainer} 
      className="map-container"
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        position: 'relative'
      }}
    />
  );
});

MapView.displayName = 'MapView';
