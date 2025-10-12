import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { generateUniqueNumber } from './services.ts'


import './map.css';

export const usePathsForm = (editMode, setEditMODE,
    pathForm,
    setPathForm,
    setPathNetwork,
    map,
    mapContainer,
    snap1,
    snap2,
    connectionState) => {
    useEffect(() => {
        // Your code here
        if (!pathForm.show) {
            return; // Don't create the form if pathForm is false
        }

        const savePath = async (newFeature, sF) => {
            try {
                const socket = await emitEvent(connectionState, 'savePath', newFeature);
                if (socket) {
                    //console.log('RV-->[RenderPathNetwork]: socket', socket.id);
                    socket.on('pathSaved', (err) => {
                        if (!err) {
                            if (!sF?.properties?.id) { //it is not an upgrade
                                console.log('RV-->[saveCrossRoad]: selectedFeature.current', sF);
                                // Add the new feature to the pathNetwork state
                                setPathNetwork((prevPathNetwork) => ({
                                    ...prevPathNetwork,
                                    features: [...prevPathNetwork.features, newFeature]
                                })
                            } else {
                                selectedFeature.current = null;
                            }
                        } else {
                            alert('Something went wrong:', err)
                        }

                    });
                }
            } catch (error) {
                alert('Something went wrong:', error)
                console.error(error);
            }
        };


        // Disable edit mode immediately because if the user clicks outside
        // the form is adding segments
        editMode.current = false;
        setEditMODE(false);
        // Calculate the angle in degrees between two points
        const calculateAngle = (point1, point2) => {
            const bearing = turf.bearing(turf.point(point1), turf.point(point2));
            return bearing >= 0 ? bearing : bearing + 360;
        };

        // Create the segment form
        const segmentForm = document.createElement('div');
        segmentForm.className = 'custom-form'; // Add a CSS class for styling

        // Set CSS styles for the form
        segmentForm.style.background = 'white';
        segmentForm.style.padding = '8px 20px'; // Add padding to the right
        segmentForm.style.borderRadius = '4px';
        segmentForm.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        segmentForm.style.fontFamily = 'Arial, sans-serif';
        segmentForm.style.fontSize = '14px';

        // Create form elements

        // Create form elements
        const idLabel = document.createElement('label');
        idLabel.textContent = 'ID:';
        idLabel.style.display = 'block';
        idLabel.style.marginBottom = '4px';

        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.name = 'ID';
        idInput.value = uuidv4(); // Set the initial value as the generated UUID
        idInput.readOnly = true; // Make the input field read-only
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
        nameInput.value = 'pathway'; // Set the initial value as 'pathway'
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

        // Create dropdown options
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

        // Create dropdown options
        const condizioneOptions = ['.', 'sterrata', 'asfaltata', 'provinciale', 'statale']; // Add your desired options here
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
        // Calculate the distance using Turf
        const lineString = turf.lineString(pathForm.coordinates);
        const distance = turf.length(lineString, { units: 'meters' });
        // Set the distance value in the input field
        distanzaInput.value = distance.toFixed(0); // Set the distance with 0 decimal places

        const v1AngleLabel = document.createElement('label');
        v1AngleLabel.textContent = 'V1 Angle:';
        v1AngleLabel.style.display = 'block';
        v1AngleLabel.style.marginBottom = '4px';

        const v1AngleInput = document.createElement('input');
        v1AngleInput.type = 'text';
        v1AngleInput.name = 'V1 Angle';
        v1AngleInput.style.width = '100%';
        v1AngleInput.style.marginLeft = '4px';
        v1AngleInput.readOnly = true; // Make the input field read-only

        const v2AngleLabel = document.createElement('label');
        v2AngleLabel.textContent = 'V2 Angle:';
        v2AngleLabel.style.display = 'block';
        v2AngleLabel.style.marginBottom = '4px';

        const v2AngleInput = document.createElement('input');
        v2AngleInput.type = 'text';
        v2AngleInput.name = 'V2 Angle';
        v2AngleInput.style.width = '100%';
        v2AngleInput.style.marginLeft = '4px';
        v2AngleInput.readOnly = true; // Make the input field read-only

        if (pathForm.coordinates.length >= 3) {
            const firstThreeCoordinates = pathForm.coordinates.slice(0, 3);
            const v1Angle = calculateAngle(firstThreeCoordinates[0], firstThreeCoordinates[2]);
            v1AngleInput.value = v1Angle.toFixed(2);
        } else if (pathForm.coordinates.length === 2) {
            const v1Angle = calculateAngle(pathForm.coordinates[0], pathForm.coordinates[1]);
            v1AngleInput.value = v1Angle.toFixed(2);
        } else if (pathForm.coordinates.length === 1) {
            v1AngleInput.value = 'N/A'; // Not enough coordinates for calculation
        } else {
            v1AngleInput.value = 'N/A'; // No coordinates available
        }

        if (pathForm.coordinates.length >= 3) {
            const lastThreeCoordinates = pathForm.coordinates.slice(-3).reverse();
            const v2Angle = calculateAngle(lastThreeCoordinates[0], lastThreeCoordinates[2]);
            v2AngleInput.value = v2Angle.toFixed(0);
        } else if (pathForm.coordinates.length === 2) {
            const v2Angle = calculateAngle(pathForm.coordinates[1], pathForm.coordinates[0]);
            v2AngleInput.value = v2Angle.toFixed(0);
        } else if (pathForm.coordinates.length === 1) {
            v2AngleInput.value = 'N/A'; // Not enough coordinates for calculation
        } else {
            v2AngleInput.value = 'N/A'; // No coordinates available
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
        vertex1Input.readOnly = true; // Make the input field read-only

        const vertex2Label = document.createElement('label');
        vertex2Label.textContent = 'Vertex 2:';
        vertex2Label.style.display = 'block';
        vertex2Label.style.marginBottom = '4px';

        const vertex2Input = document.createElement('input');
        vertex2Input.type = 'text';
        vertex2Input.name = 'Vertex 2';
        vertex2Input.style.width = '100%';
        vertex2Input.style.marginLeft = '4px';
        vertex2Input.readOnly = true; // Make the input field read-only

        // Get the first and last coordinates from pathForm.coordinates
        const firstCoordinate = pathForm.coordinates[0];
        const lastCoordinate = pathForm.coordinates[pathForm.coordinates.length - 1];
        // Set the values in the input fields
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

            // Get the entered values
            const id = idInput.value;
            const nome = nameInput.value;
            const tipo = tipoInput.value;
            const condizione = condizioneInput.value;
            const distanza = distanzaInput.value;
            const v1Angle = v1AngleInput.value;
            const v2Angle = v2AngleInput.value;
            const vertex1 = vertex1Input.value;
            const vertex2 = vertex2Input.value;

            // Create a new feature object with the entered properties
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
                    Distanza: distanza,
                    'V1 Angle': v1Angle,
                    'V2 Angle': v2Angle,
                    v1: snap1.current.featureId,
                    v2: snap2.current.featureId,
                },
            };

            // Add the new feature to the crossRoads state
            setPathNetwork(prevPathNetwork => ({
                ...prevPathNetwork,
                features: [...prevPathNetwork.features, newSegment]
            }));

            // Clear the form inputs
            idInput.value = '';
            nameInput.value = '';
            tipoInput.value = '';
            condizioneInput.value = '';
            distanzaInput.value = '';
            v1AngleInput.value = '';
            v2AngleInput.value = '';
            vertex1Input.value = '';
            vertex2Input.value = '';

            map.current.removeLayer('tempLineLayer');
            map.current.removeLayer('tempPointLayer');
            map.current.removeSource('tempLineSource');
            map.current.removeSource('tempPointSource');


            map.current.getCanvas().style.cursor = '';

            // Close the form or perform any other actions
            setPathForm({ show: false, coordinates: null });
        });

        // Handle form cancellation
        cancelButton.addEventListener('click', () => {
            editMode.current = true;
            setEditMODE(true)
            setPathForm({ show: false, coordinates: null });

        });

        // Append form elements to the form
        // Append the form elements to the segment form
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

        // Position the form at the center of the map
        //const mapContainer = map.current.getContainer();
        const mapWidth = mapContainer.current.offsetWidth;
        const mapHeight = mapContainer.current.offsetHeight;
        //const centerLngLat = map.continer.unproject([mapWidth / 2, mapHeight / 2]);

        // Set the popup's position
        segmentForm.style.position = 'absolute';
        segmentForm.style.left = `${mapWidth / 2.5}px`;
        segmentForm.style.top = `${5}px`;



        if (mapContainer.current) {
            // Append the form to the map container
            mapContainer.current.appendChild(segmentForm);
        }

        // Cleanup function
        return () => {
            // Remove the form when the component unmounts or `pathForm` changes to `false`
            if (mapContainer.current && segmentForm.parentNode === mapContainer.current) {
                mapContainer.current.removeChild(segmentForm);
            }
        };

        // ...

    }, [pathForm.show, pathForm.coordinates]);
};