import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { v4 as uuidv4 } from 'uuid';
import { emitEvent, getSocketInstance } from './sockets.ts';

import './map.css';
import { generateUniqueNumber } from './services.ts'

export const useCrossRoadForm = (showForm,
    setShowForm,
    setCrossRoads,
    setDestNetwork,
    map,
    mapContainer,
    connectionState,
    selectedFeature,) => {

    useEffect(() => {
        // Your code here
        if (!showForm.show) {
            return; // Don't create the form if showForm is false
        }
        const saveCrossRoad = async (newFeature, sF) => {
            try {
                const socket = await emitEvent(connectionState, 'saveCrossRoad', newFeature);
                if (socket) {
                    //console.log('RV-->[RenderPathNetwork]: socket', socket.id);
                    socket.on('crossRoadSaved', (err) => {
                        if (!err) {
                            if (!sF?.properties?.id) { //it is not an upgrade
                                console.log('RV-->[saveCrossRoad]: selectedFeature.current', sF);
                                // Add the new feature to the crossRoads state
                                if (newFeature.properties.Tipo == 'destinazione') {
                                    setDestNetwork((prevDestNetwork) => ({
                                        ...prevDestNetwork,
                                        features: [...prevDestNetwork.features, newFeature]
                                    }));
                                } else {
                                    setCrossRoads((prevCrossRoads) => ({
                                        ...prevCrossRoads,
                                        features: [...prevCrossRoads.features, newFeature]
                                    }));
                                }
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


        const crossRoadForm = document.createElement('div');
        crossRoadForm.className = 'custom-form'; // Add a CSS class for styling

        // Set CSS styles for the form
        crossRoadForm.style.background = 'white';
        crossRoadForm.style.padding = '8px 20px'; // Add padding to the right
        crossRoadForm.style.borderRadius = '4px';
        crossRoadForm.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        crossRoadForm.style.fontFamily = 'Arial, sans-serif';
        crossRoadForm.style.fontSize = '14px';


        // Create form elements

        // Create form elements
        const idLabel = document.createElement('label');
        idLabel.textContent = 'ID:';
        idLabel.style.display = 'block';
        idLabel.style.marginBottom = '4px';

        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.name = 'ID';
        idInput.value = selectedFeature?.current?.properties?.id || uuidv4();
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
        nameInput.value = selectedFeature?.current?.properties?.Nome || 'Bivio';
        nameInput.style.width = '100%';
        nameInput.style.marginLeft = '4px';

        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Tipo:';
        typeLabel.style.display = 'block';
        typeLabel.style.marginBottom = '4px';

        const typeInput = document.createElement('select');
        typeInput.name = 'Tipo';
        typeInput.style.width = '100%';
        typeInput.style.marginLeft = '4px';
        typeInput.value = selectedFeature?.current?.properties?.Tipo || 'bivio';
        console.log('RV-->[saveCrossRoad]: selectedFeature?.current?.properties?.Tipo', selectedFeature?.current?.properties?.Tipo);

        // Create dropdown options
        const tipoOptions = ['bivio', 'destinazione', 'incrocio', 'POI', 'indicazione'];
        tipoOptions.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue;
            typeInput.appendChild(option);
        });

        const geoFenceLabel = document.createElement('label');
        geoFenceLabel.textContent = 'GeoFence:';
        geoFenceLabel.style.display = 'block';
        geoFenceLabel.style.marginBottom = '4px';

        const geoFenceInput = document.createElement('select');
        geoFenceInput.name = 'GeoFence';
        geoFenceInput.style.width = '100%';
        geoFenceInput.style.marginLeft = '4px';
        geoFenceInput.value = selectedFeature?.current?.properties?.GeoFence || 20;

        // Create dropdown options
        const geoFenceOptions = [20, 25, 30, 50, 100, 200, 500];
        geoFenceOptions.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue;
            geoFenceInput.appendChild(option);
        });

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
            //Insert Mode
            var lng = showForm.coordinates.lng;
            var lat = showForm.coordinates.lat;
            if (selectedFeature?.current?.geometry?.updateCoords) {
                //Upgrade Mode
                const featureCoordinates = selectedFeature.current.geometry.updateCoords;
                lng = featureCoordinates[0];
                lat = featureCoordinates[1];
            }
            // Create a new feature object
            const newFeature = {
                type: 'Feature',
                properties: {
                    Tipo: typeInput.value,
                    GeoFence: parseInt(geoFenceInput.value),
                    Nome: nameInput.value,
                    IDF: selectedFeature?.current?.properties?.IDF || generateUniqueNumber(),
                    id: idInput.value,
                },
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                }
            };

            // save into database
            if (connectionState) saveCrossRoad(newFeature, selectedFeature.current);
            //

            // Clear the form inputs
            idInput.value = '';
            nameInput.value = '';
            typeInput.value = '';
            geoFenceInput.value = '';

            // Close the form or perform any other actions
            setShowForm({ show: false, coordinates: null });
        });

        // Handle form cancellation
        cancelButton.addEventListener('click', () => {
            //newFeature.geometry.coordinates = [showForm.coordinates.lng, howForm.coordinates.lat]
            setShowForm({ show: false, coordinates: null });
        });

        // Append form elements to the form
        crossRoadForm.appendChild(idLabel);
        crossRoadForm.appendChild(idInput);
        crossRoadForm.appendChild(nameLabel);
        crossRoadForm.appendChild(nameInput);
        crossRoadForm.appendChild(typeLabel);
        crossRoadForm.appendChild(typeInput);
        crossRoadForm.appendChild(geoFenceLabel);
        crossRoadForm.appendChild(geoFenceInput);
        crossRoadForm.appendChild(buttonContainer);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);

        // Position the form near the clicked coordinates
        const offsetX = 10; // Adjust the X offset as needed
        const offsetY = -10; // Adjust the Y offset as needed
        const pos = map.current.project(showForm.coordinates).add(new maplibregl.Point(offsetX, offsetY));
        crossRoadForm.style.position = 'absolute';
        crossRoadForm.style.left = pos.x + 'px';
        crossRoadForm.style.top = pos.y + 'px';

        // Access the context menu from the map container
        if (mapContainer.current) {
            // Append the form to the map container
            mapContainer.current.appendChild(crossRoadForm);
        }

        // Cleanup function
        return () => {
            // Remove the form when the component unmounts or `showForm` changes to `false`
            if (mapContainer.current && crossRoadForm.parentNode === mapContainer.current) {
                mapContainer.current.removeChild(crossRoadForm);
                // Additional instructions when the form is closed
                selectedFeature.current = null;
            }
        };

        // ...

    }, [showForm.show, showForm.coordinates]);
};