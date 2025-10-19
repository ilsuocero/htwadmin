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

    const condizioneOptions = ['.', 'sterrata', 'asfaltata', 'provinciale', 'statale'];
    condizioneOptions.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.text = optionValue;
      condizioneInput.appendChild(option);
    });

    const distanzaLabel = document.createElement('label');
    distanzaLabel.textContent = 'Distanza:';
    distanzaLabel.style.display = 'block';
    distanzaLabel.style.marginBottom = '4px';

    const distanzaInput = document.createElement('input');
    distanzaInput.type = 'text';
    distanzaInput.name = 'Distanza';
    distanzaInput.style.width = '100%';
    distanzaInput.style.marginLeft = '4px';
    
    const lineString = turf.lineString(pathForm.coordinates);
    const distance = turf.length(lineString, { units: 'meters' });
    distanzaInput.value = distance.toFixed(0);

    const v1AngleLabel = document.createElement('label');
    v1AngleLabel.textContent = 'V1 Angle:';
    v1AngleLabel.style.display = 'block';
    v1AngleLabel.style.marginBottom = '4px';

    const v1AngleInput = document.createElement('input');
    v1AngleInput.type = 'text';
    v1AngleInput.name = 'V1 Angle';
    v1AngleInput.style.width = '100%';
    v1AngleInput.style.marginLeft = '4px';
    v1AngleInput.readOnly = true;

    const v2AngleLabel = document.createElement('label');
    v2AngleLabel.textContent = 'V2 Angle:';
    v2AngleLabel.style.display = 'block';
    v2AngleLabel.style.marginBottom = '4px';

    const v2AngleInput = document.createElement('input');
    v2AngleInput.type = 'text';
    v2AngleInput.name = 'V2 Angle';
    v2AngleInput.style.width = '100%';
    v2AngleInput.style.marginLeft = '4px';
    v2AngleInput.readOnly = true;

    // Calculate angles
    if (pathForm.coordinates.length >= 3) {
      const firstThreeCoordinates = pathForm.coordinates.slice(0, 3);
      const v1Angle = calculateAngle(firstThreeCoordinates[0], firstThreeCoordinates[2]);
      v1AngleInput.value = v1Angle.toFixed(2);
    } else if (pathForm.coordinates.length === 2) {
      const v1Angle = calculateAngle(pathForm.coordinates[0], pathForm.coordinates[1]);
      v1AngleInput.value = v1Angle.toFixed(2);
    } else {
      v1AngleInput.value = 'N/A';
    }

    if (pathForm.coordinates.length >= 3) {
      const lastThreeCoordinates = pathForm.coordinates.slice(-3).reverse();
      const v2Angle = calculateAngle(lastThreeCoordinates[0], lastThreeCoordinates[2]);
      v2AngleInput.value = v2Angle.toFixed(0);
    } else if (pathForm.coordinates.length === 2) {
      const v2Angle = calculateAngle(pathForm.coordinates[1], pathForm.coordinates[0]);
      v2AngleInput.value = v2Angle.toFixed(0);
    } else {
      v2AngleInput.value = 'N/A';
    }

    const vertex1Label = document.createElement('label');
    vertex1Label.textContent = 'Vertex 1:';
    vertex1Label.style.display = 'block';
    vertex1Label.style.marginBottom = '4px';

    const vertex1Input = document.createElement('input');
    vertex1Input.type = 'text';
    vertex1Input.name = 'Vertex 1';
    vertex1Input.style.width = '100%';
    vertex1Input.style.marginLeft = '4px';
    vertex1Input.readOnly = true;

    const vertex2Label = document.createElement('label');
    vertex2Label.textContent = 'Vertex 2:';
    vertex2Label.style.display = 'block';
    vertex2Label.style.marginBottom = '4px';

    const vertex2Input = document.createElement('input');
    vertex2Input.type = 'text';
    vertex2Input.name = 'Vertex 2';
    vertex2Input.style.width = '100%';
    vertex2Input.style.marginLeft = '4px';
    vertex2Input.readOnly = true;

    // Get the first and last coordinates
    const firstCoordinate = pathForm.coordinates[0];
    const lastCoordinate = pathForm.coordinates[pathForm.coordinates.length - 1];
    vertex1Input.value = JSON.stringify(firstCoordinate);
    vertex2Input.value = JSON.stringify(lastCoordinate);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.marginTop = '8px';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.marginLeft = '8px';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';

    // Handle form submission
    submitButton.addEventListener('click', (e) => {
      e.preventDefault();

      const id = idInput.value;
      const nome = nameInput.value;
      const tipo = tipoInput.value;
      const condizione = condizioneInput.value;
      const distanza = distanzaInput.value;
      const v1Angle = v1AngleInput.value;
      const v2Angle = v2AngleInput.value;

      const newSegment = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: pathForm.coordinates,
        },
        properties: {
          id: id,
          ID: generateUniqueNumber(),
          Nome: nome,
          Tipo: tipo,
          Condizione: condizione,
          Distanza: parseInt(distanza),
          V1Angle: parseInt(v1Angle),
          V2Angle: parseInt(v2Angle),
          v1: pathForm.snap1?.featureId,
          v2: pathForm.snap2?.featureId,
        },
      };

      if (connectionState) savePath(newSegment, selectedFeature.current);

      // Clean up temporary layers
      if (map.current) {
        if (map.current.getLayer('tempLineLayer')) {
          map.current.removeLayer('tempLineLayer');
        }
        if (map.current.getLayer('tempPointLayer')) {
          map.current.removeLayer('tempPointLayer');
        }
        if (map.current.getSource('tempLineSource')) {
          map.current.removeSource('tempLineSource');
        }
        if (map.current.getSource('tempPointSource')) {
          map.current.removeSource('tempPointSource');
        }
        map.current.getCanvas().style.cursor = '';
      }

      setPathForm({ show: false, coordinates: null });
    });

    // Handle form cancellation
    cancelButton.addEventListener('click', () => {
      editMode.current = true;
      setEditMode(true);
      setPathForm({ show: false, coordinates: null, snap1: null, snap2: null });
    });

    // Append form elements
    segmentForm.appendChild(idLabel);
    segmentForm.appendChild(idInput);
    segmentForm.appendChild(nameLabel);
    segmentForm.appendChild(nameInput);
    segmentForm.appendChild(tipoLabel);
    segmentForm.appendChild(tipoInput);
    segmentForm.appendChild(condizioneLabel);
    segmentForm.appendChild(condizioneInput);
    segmentForm.appendChild(distanzaLabel);
    segmentForm.appendChild(distanzaInput);
    segmentForm.appendChild(v1AngleLabel);
    segmentForm.appendChild(v1AngleInput);
    segmentForm.appendChild(v2AngleLabel);
    segmentForm.appendChild(v2AngleInput);
    segmentForm.appendChild(vertex1Label);
    segmentForm.appendChild(vertex1Input);
    segmentForm.appendChild(vertex2Label);
    segmentForm.appendChild(vertex2Input);
    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(cancelButton);
    segmentForm.appendChild(buttonContainer);

    // Position the form
    if (mapContainer.current) {
      const mapWidth = mapContainer.current.offsetWidth;
      const mapHeight = mapContainer.current.offsetHeight;
      segmentForm.style.left = `${mapWidth / 2.5}px`;
      segmentForm.style.top = `${5}px`;
      mapContainer.current.appendChild(segmentForm);
    }

    // Cleanup function
    return () => {
      if (mapContainer.current && segmentForm.parentNode === mapContainer.current) {
        mapContainer.current.removeChild(segmentForm);
      }
    };

  }, [pathForm.show, pathForm.coordinates]);
};

