import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { v4 as uuidv4 } from 'uuid';
import { emitEvent, getSocketInstance } from './sockets.ts';
import { useNavigate } from "react-router-dom";
import "../page/POIedit";

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

    const navigate = useNavigate();
    const POI = useRef(null);
    POI.current = false;

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
                            if (sF?.properties?.Tipo == 'POI') POI.current = true;
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
        typeInput.value = '';

        // Create dropdown options
        const tipoOptions = ['bivio', 'destinazione', 'incrocio', 'POI', 'indicazione'];
        tipoOptions.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue;
            typeInput.appendChild(option);
        });

        // Set the selected value
        const tipoValue = selectedFeature?.current?.properties?.Tipo || '';
        typeInput.value = tipoValue;

        // Set the default option if tipoValue is not in tipoOptions
        if (!tipoOptions.includes(tipoValue)) {
            const defaultOption = document.createElement('option');
            defaultOption.value = tipoValue;
            defaultOption.text = tipoValue;
            typeInput.insertBefore(defaultOption, typeInput.firstChild);
        }

        const geoFenceLabel = document.createElement('label');
        geoFenceLabel.textContent = 'GeoFence:';
        geoFenceLabel.style.display = 'block';
        geoFenceLabel.style.marginBottom = '4px';

        const geoFenceInput = document.createElement('select');
        geoFenceInput.name = 'GeoFence';
        geoFenceInput.style.width = '100%';
        geoFenceInput.style.marginLeft = '4px';
        geoFenceInput.value = null; // Change this line

        // Create dropdown options
        const geoFenceOptions = [20, 25, 30, 50, 100, 200, 500];
        geoFenceOptions.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue;
            geoFenceInput.appendChild(option);
        });

        // Set the selected value
        const geoFenceValue = selectedFeature?.current?.properties?.GeoFence || 20;
        console.log('RV-->[crossRoadForm]: selectedFeature', selectedFeature?.current?.properties);
        geoFenceInput.value = geoFenceValue;

        // Set the default option if geoFenceValue is not in geoFenceOptions
        if (!geoFenceOptions.includes(geoFenceValue)) {
            const defaultOption = document.createElement('option');
            defaultOption.value = geoFenceValue;
            defaultOption.text = geoFenceValue;
            geoFenceInput.insertBefore(defaultOption, geoFenceInput.firstChild);
        }

        const shortDescriptionLabel = document.createElement('label');
        shortDescriptionLabel.style.display = 'block';
        shortDescriptionLabel.style.marginBottom = '4px';
        shortDescriptionLabel.textContent = '';

        const shortDescriptionInput = document.createElement('input');
        shortDescriptionInput.type = 'text';
        shortDescriptionInput.name = 'ShortDescription';
        shortDescriptionInput.style.width = '100%';
        shortDescriptionInput.style.marginLeft = '4px';

        const longDescriptionLabel = document.createElement('label');
        longDescriptionLabel.textContent = 'Long Description:';
        longDescriptionLabel.style.display = 'block';
        longDescriptionLabel.style.marginBottom = '4px';

        const longDescriptionInput = document.createElement('textarea');
        longDescriptionInput.name = 'LongDescription';
        longDescriptionInput.style.width = '100%';
        longDescriptionInput.style.height = '100px';
        longDescriptionInput.style.marginLeft = '4px';

        // Create labels and inputs for the Italian descriptions
        const shortDescriptionLabel2 = document.createElement('label');
        shortDescriptionLabel2.style.display = 'none';  // Initially hidden
        shortDescriptionLabel2.style.marginBottom = '4px';
        shortDescriptionLabel2.textContent = '';

        const shortDescriptionInput2 = document.createElement('textarea');
        shortDescriptionInput2.name = 'DescBreveIt';
        shortDescriptionInput2.style.width = '100%';
        shortDescriptionInput2.style.marginLeft = '4px';
        shortDescriptionInput2.style.display = 'none';  // Initially hidden

        const longDescriptionLabelIt = document.createElement('label');
        longDescriptionLabelIt.textContent = 'Descrizione estesa (Italiano):';
        longDescriptionLabelIt.style.display = 'block';  // Initially hidden
        longDescriptionLabelIt.style.marginBottom = '4px';

        const longDescriptionInput2 = document.createElement('textarea');
        longDescriptionInput2.name = 'DescEstesaIt';
        longDescriptionInput2.style.width = '100%';
        longDescriptionInput2.style.height = '100px';
        longDescriptionInput2.style.marginLeft = '4px';



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
            // Input validation
            if (typeInput.value === 'POI') {
                if (shortDescriptionInput.value.length < 30) {
                    alert('Short description must be at least 30 characters long.');
                    return;
                }
                if (longDescriptionInput.value.length < 100) {
                    alert('Long description must be at least 100 characters long.');
                    return;
                }
                if (shortDescriptionInput2.value.length < 30) {
                    alert('Italian short description must be at least 30 characters long.');
                    return;
                }
                if (longDescriptionInput2.value.length < 100) {
                    alert('Italian long description must be at least 100 characters long.');
                    return;
                }
            }
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
                    languageL1: 'en',
                    descriptions: [
                        {
                            language: 'en',
                            DescBreve: shortDescriptionInput.value,
                            DescEstesa: longDescriptionInput.value
                        },
                        {
                            language: 'it',
                            DescBreve: shortDescriptionInput2.value,
                            DescEstesa: longDescriptionInput2.value
                        }
                    ]
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
        crossRoadForm.appendChild(shortDescriptionLabel);
        crossRoadForm.appendChild(shortDescriptionInput);
        crossRoadForm.appendChild(longDescriptionLabel);
        crossRoadForm.appendChild(longDescriptionInput);
        crossRoadForm.appendChild(shortDescriptionLabel2);
        crossRoadForm.appendChild(shortDescriptionInput2);
        crossRoadForm.appendChild(longDescriptionLabelIt);
        crossRoadForm.appendChild(longDescriptionInput2);


        // Position the form near the clicked coordinates
        const offsetX = 10; // Adjust the X offset as needed
        const offsetY = -10; // Adjust the Y offset as needed
        const pos = map.current.project(showForm.coordinates).add(new maplibregl.Point(offsetX, offsetY));
        crossRoadForm.style.position = 'absolute';
        crossRoadForm.style.left = pos.x + 'px';
        crossRoadForm.style.top = pos.y + 'px';

        // Handle changes to the 'Tipo' and 'name' fields
        nameInput.addEventListener('change', (e) => {
            if (typeInput.value === 'POI') {
                shortDescriptionLabel2.textContent = 'Sei a ' + nameInput.value + '...' + 
                ' (u';
                shortDescriptionLabel.textContent = 'You are at ' + nameInput.value + '...';
            }
        })
        typeInput.addEventListener('change', (e) => {
            if (e.target.value === 'POI') {
                // Make form full screen
                crossRoadForm.style.position = 'absolute';
                crossRoadForm.style.top = '0';
                crossRoadForm.style.left = '0';
                crossRoadForm.style.width = '98%';
                crossRoadForm.style.height = '100%';
                crossRoadForm.style.background = 'rgba(255, 255, 255, 0.8)';  // Semi-transparent white

                shortDescriptionLabel.style.display = 'block';
                shortDescriptionInput.style.display = 'block';
                longDescriptionLabel.style.display = 'block';
                longDescriptionInput.style.display = 'block';

                shortDescriptionLabel2.style.display = 'block';
                shortDescriptionInput2.style.display = 'block';
                longDescriptionLabelIt.style.display = 'block';
                longDescriptionInput2.style.display = 'block';
            } else {
                // Reset form to original size and position
                crossRoadForm.style.position = 'absolute';
                crossRoadForm.style.left = pos.x + 'px';
                crossRoadForm.style.top = pos.y + 'px';
                crossRoadForm.style.width = 'auto';  // Adjust this as necessary
                crossRoadForm.style.height = 'auto';  // Adjust this as necessary
                crossRoadForm.style.background = 'white';

                shortDescriptionLabel.style.display = 'none';
                shortDescriptionInput.style.display = 'none';
                longDescriptionLabel.style.display = 'none';
                longDescriptionInput.style.display = 'none';

                shortDescriptionLabel2.style.display = 'none';
                shortDescriptionInput2.style.display = 'none';
                longDescriptionLabelIt.style.display = 'none';
                longDescriptionInput2.style.display = 'none';
            }
        });

        // Trigger the 'change' event
        typeInput.dispatchEvent(new Event('change'));
        nameInput.dispatchEvent(new Event('change'));


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