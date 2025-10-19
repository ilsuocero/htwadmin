import React, { useEffect } from 'react';
import { emitEvent } from './sockets';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { generateUniqueNumber } from './services';

export const usePathForm = (
  editMode,
  setEditMode,
  pathForm,
  setPathForm,
  setPathNetwork,
  map,
  mapContainer,
  connectionState,
  selectedFeature
) => {
  useEffect(() => {
    if (!pathForm.show) {
      return; // Don't create the form if pathForm is false
    }

    const savePath = async (newSegment, sF) => {
      console.log('🚀 [savePath]: newFeature', newSegment);
      try {
        const socket = await emitEvent(connectionState, 'saveSegment', newSegment);
        if (socket) {
          socket.on('segmentSaved', (err) => {
            if (!err) {
              console.log('🚀 [savePath]: selectedFeature.current', sF);
              if (!sF?.properties?.id) { // it is not an upgrade
                // Add the new feature to the pathNetwork state
                setPathNetwork(prevPathNetwork => ({
                  ...prevPathNetwork,
                  features: [...prevPathNetwork.features, newSegment]
                }));
              } else {
                selectedFeature.current = null;
              }
            } else {
              alert('Something went wrong:', err);
            }
          });
        }
      } catch (error) {
        alert('Something went wrong:', error);
        console.error(error);
      }
    };

    // Disable edit mode immediately because if the user clicks outside
    // the form is adding segments
    editMode.current = false;
    setEditMode(false);

    // Calculate the angle in degrees between two points
    const calculateAngle = (point1, point2) => {
      const bearing = turf.bearing(turf.point(point1), turf.point(point2));
      return bearing >= 0 ? bearing : bearing + 360;
    };

    // Create the segment form
    const segmentForm = document.createElement('div');
    segmentForm.className = 'custom-form';

    // Set CSS styles for the form
    segmentForm.style.background = 'white';
    segmentForm.style.padding = '8px 20px';
    segmentForm.style.borderRadius = '4px';
