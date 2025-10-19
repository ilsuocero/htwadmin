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
    segmentForm.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    segmentForm.style.fontFamily = 'Arial, sans-serif';
    segmentForm.style.fontSize = '14px';
    segmentForm.style.zIndex = '1000';
    segmentForm.style.position = 'absolute';

    // Create form elements
    const idLabel = document.createElement('label');
    idLabel.textContent = 'ID:';
    idLabel.style.display = 'block';
    idLabel.style.marginBottom = '4px';

    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.name = 'ID';
    idInput.value = uuidv4();
    idInput.readOnly = true;
    idInput.style.width = '100%';
    idInput.style.marginLeft = '4px';

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nome:';
    nameLabel.style.display = 'block';
    nameLabel.style.marginBottom = '4px';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'Nome';
    nameInput.required = true;
    nameInput.value = 'pathway';
    nameInput.style.width = '100%';
    nameInput.style.marginLeft = '4px';

    const tipoLabel = document.createElement('label');
    tipoLabel.textContent = 'Tipo:';
    tipoLabel.style.display = 'block';
    tipoLabel.style.marginBottom = '4px';

    const tipoInput = document.createElement('select');
    tipoInput.name = 'Tipo';
    tipoInput.style.width = '100%';
    tipoInput.style.marginLeft = '4px';

    const tipoOptions = ['sentiero', 'strada', 'campo', 'tratturo'];
    tipoOptions.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.text = optionValue;
      tipoInput.appendChild(option);
    });

    const condizioneLabel = document.createElement('label');
    condizioneLabel.textContent = 'Condizione:';
    condizioneLabel.style.display = 'block';
    condizioneLabel.style.marginBottom = '4px';

    const condizioneInput = document.createElement('select');
    condizioneInput.name = 'Condizione';
    condizioneInput.style.width = '100%';
    condizioneInput.style.marginLeft = '4px';

