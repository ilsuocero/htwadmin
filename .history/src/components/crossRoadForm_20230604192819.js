import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { v4 as uuidv4 } from 'uuid';
import { emitEvent, getSocketInstance } from './sockets.ts';

import './map.css';
import { generateUniqueNumber } from './services.ts'

export const useCrossRoadForm = (showForm, setShowForm, setCrossRoads, setDestNetwork, map, mapContainer) => {
    useEffect(() => {
        // Your code here
        if (!showForm.show) {
            return; // Don't create the form if showForm is false
        }
        const saveCrossRoad = async () => {
            try {
                const socket = await emitEvent(connectionState, 'saveCrossRoad');
                if (socket) {
                    //console.log('RV-->[RenderPathNetwork]: socket', socket.id);
                    socket.on('crossRoadSaved', (yes) => {
                        if (yes) {

                        }
                     
                    });
                }
            } catch (error) {
                console.error(error);
            }
            // Return a function to clean up the effect
            return () => {
                const socket = getSocketInstance();
                socket.off('printIncroci');
            };
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
        nameInput.value = 'Bivio'; // Set the initial value as 'pathway'
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

            // Get the entered values
            const id = uuidv4(); // Generate a random UUID
            const nome = nameInput.value;
            const tipo = typeInput.value;
            const geoFence = parseInt(geoFenceInput.value);

            // Create a new feature object
            const newFeature = {
                type: 'Feature',
                properties: {
                    Tipo: tipo,
                    GeoFence: geoFence,
                    Nome: nome,
                    ID: generateUniqueNumber(),
                    id: id
                },
                geometry: {
                    type: 'Point',
                    coordinates: [showForm.coordinates.lng, showForm.coordinates.lat]
                }
            };

            // save into database
            if (connectionState) saveCrossRoad();
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
            }
        };
   
        // ...

    }, [showForm.show, showForm.coordinates]);
};