import { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  // Refs to track segment creation state
  const tempPointsRef = useRef([]);
  const snapCrossRef = useRef(null);
  const snap1Ref = useRef(null);
  const snap2Ref = useRef(null);
  
  const handleEditModeClick = useCallback((e) => {
    console.log('Edit mode click at:', e.lngLat);
    
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Check if we already have both endpoints snapped
    if (snap1Ref.current && snap2Ref.current) {
      alert('You already concluded the segment. \nSave it or Quit. \nTo continue to edit, cancel one or some sub-segment.');
      return;
    }
    
    let clickedCoords = [e.lngLat.lng, e.lngLat.lat];
    
    // Check if we're snapping to an existing feature
    if (snapCrossRef.current) {
      const { clickedCoordinates, featureId, featureType } = snapCrossRef.current;
      console.log('Snapping to feature:', featureId, clickedCoordinates);
      clickedCoords = clickedCoordinates;
      
      // Store the snap coordinates
      if (!snap1Ref.current) {
        console.log('First snap to feature');
        snap1Ref.current = { clickedCoords, featureId, featureType };
      } else {
        console.log('Second snap to feature');
        snap2Ref.current = { clickedCoords, featureId, featureType };
      }
    } else {
      // The segment must start and end from a destination or a crossroad
      if (!snap1Ref.current) {
        alert('You must start from a destination or a crossroad. \nWarning: before creating the segment check if both \nendpoints ( )<-segment->( ) are in place.');
        return;
      }
    }
    
    // Add the clicked point to our temporary points
    const clickedPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: clickedCoords,
      },
      properties: {},
    };
    
    tempPointsRef.current.push(clickedPoint);
    
    // Update the temporary point source
    const tempPointSource = map.getSource('tempPointSource');
    if (tempPointSource) {
      const tempPointData = {
        type: 'FeatureCollection',
        features: tempPointsRef.current,
      };
      tempPointSource.setData(tempPointData);
    }
    
    // Update the temporary line source
    const tempLineSource = map.getSource('tempLineSource');
    if (tempLineSource) {
      const lineStringFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: tempPointsRef.current.map(point => point.geometry.coordinates),
        },
        properties: {},
      };
      tempLineSource.setData(lineStringFeature);
    }
    
    // If we have both endpoints snapped, we can save the segment
    if (snap1Ref.current && snap2Ref.current) {
      console.log('Segment ready for saving - both endpoints snapped');
      // The segment will be saved when user presses 's' or through other means
    }
        }
      });
    }
  }, [currentMode, dispatch]);
  
  return {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  };
};
