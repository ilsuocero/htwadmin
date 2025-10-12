import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { v4 as uuidv4 } from 'uuid';

import './map.css';

export const usePathsForm = (editMode, setEditMODE,
    pathForm, 
    setPathForm, 
    setPathNetwork, 
    map, 
    mapContainer) => {
    useEffect(() => {
        // Your code here
        if (!pathForm.show) {
            return; // Don't create the form if pathForm is false
        }



            // Add the new feature to the crossRoads state
            setPathNetwork(prevPathNetwork => ({
                ...prevPathNetwork,
                features: [...prevPathNetwork.features, newFeature]
            }));

            // Clear the form inputs
            idInput.value = '';
            nameInput.value = '';
            typeInput.value = '';
            geoFenceInput.value = '';

            map.current.removeLayer('tempLineLayer');
            map.current.removeLayer('tempPointLayer');
            map.current.removeSource('tempLineSource');
            map.current.removeSource('tempPointSource');

            // Step 5: Disable edit mode
            editMode.current = false;
            setEditMODE(false)
            map.current.getCanvas().style.cursor = '';

            // Close the form or perform any other actions
            setPathForm({ show: false, coordinates: null });
        });

        // Handle form cancellation
        cancelButton.addEventListener('click', () => {
            setPathForm({ show: false, coordinates: null });
        });

        // Append form elements to the form
        pathForm.appendChild(idLabel);
        pathForm.appendChild(idInput);
        pathForm.appendChild(nameLabel);
        pathForm.appendChild(nameInput);
        pathForm.appendChild(typeLabel);
        pathForm.appendChild(typeInput);
        pathForm.appendChild(geoFenceLabel);
        pathForm.appendChild(geoFenceInput);
        pathForm.appendChild(buttonContainer);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);

        // Position the form near the clicked coordinates
        const offsetX = 10; // Adjust the X offset as needed
        const offsetY = -10; // Adjust the Y offset as needed
        const pos = map.current.project(pathForm.coordinates).add(new maplibregl.Point(offsetX, offsetY));
        pathForm.style.position = 'absolute';
        pathForm.style.left = pos.x + 'px';
        pathForm.style.top = pos.y + 'px';

        // Access the context menu from the map container
        if (mapContainer.current) {
            // Append the form to the map container
            mapContainer.current.appendChild(pathForm);
        }

        // Cleanup function
        return () => {
            // Remove the form when the component unmounts or `pathForm` changes to `false`
            if (mapContainer.current && pathForm.parentNode === mapContainer.current) {
                mapContainer.current.removeChild(pathForm);
            }
        };
   
        // ...

    }, [pathForm.show, pathForm.coordinates]);
};