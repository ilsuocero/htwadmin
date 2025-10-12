import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import './map.css';

export default function Map({ pathNetwork, destNetwork, crossRoads }) {
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const popup = useRef(null);
    const [lng] = useState(9.49709);
    const [lat] = useState(44.88096);
    const [zoom] = useState(14);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!map.current && !mapLoaded) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style:
                    'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
                center: [lng, lat],
                zoom: zoom,
            });

            map.current.on('load', () => {
                setMapLoaded(true);
                map.current.on('click', function (e) {
                    // Get the clicked coordinates
                    var coordinates = e.lngLat;

                    // Handle the left-click event
                    alert(`Left-clicked outside any layers at coordinates: ${coordinates}`);
                });
                // Add contextmenu event listener to the map
                map.current.on('contextmenu', function (e) {
                    // Prevent the default context menu
                    e.preventDefault();

                    // Get the clicked coordinates
                    var coordinates = e.lngLat;

                    // Handle the right-click event
                    //                    alert(`Right-clicked outside any layers at coordinates: ${coordinates}`);
                    // Create and position the custom context menu
                    showContextMenu(coordinates);
                });
            });
        }

        return () => {
            map.current = null;
        };
    }, []);

    const showContextMenu = (coordinates) => {
        // Create a custom context menu element
        const contextMenu = document.createElement('div');
        contextMenu.className = 'custom-context-menu';
        contextMenu.style.background = 'white'; // Set the background color
        contextMenu.style.padding = '8px'; // Add padding
        contextMenu.style.borderRadius = '4px'; // Add border radius
        contextMenu.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; // Add box shadow
        contextMenu.style.fontFamily = 'Arial, sans-serif'; // Set font family
        contextMenu.style.fontSize = '14px'; // Set font size

        // Create menu entries
        const entry1 = document.createElement('div');
        entry1.className = 'menu-entry';
        entry1.innerHTML = 'New Crossroad';
        entry1.style.marginBottom = '4px'; // Add spacing between entries

        const entry2 = document.createElement('div');
        entry2.className = 'menu-entry';
        entry2.innerHTML = 'New Segment';

        // Append menu entries to the context menu
        contextMenu.appendChild(entry1);
        contextMenu.appendChild(entry2);

        // Position the context menu near the clicked coordinates
        const offsetX = 10; // Adjust the X offset as needed
        const offsetY = -10; // Adjust the Y offset as needed
        const pos = map.current.project(coordinates);
        contextMenu.style.left = pos.x + offsetX + 'px';
        contextMenu.style.top = pos.y + offsetY + 'px';

        // Add the context menu to the map container
        mapContainer.current.appendChild(contextMenu);

        // Add event listeners to the menu entries
        entry1.addEventListener('click', (e) => {
            // Open the custom dialog to input crossroad properties
            setShowForm(true);
        });

        entry2.addEventListener('click', (e) => {
            // Handle the "New Segment" menu entry click
            alert('New Segment');
        });

        // Add a "click" event listener to close the context menu
        document.addEventListener('click', (e) => {
            if (e.target !== entry1 && e.target !== entry2) {
                // Remove the context menu from the map container
                contextMenu.remove();
            }
        });
    };

    const handleFormSave = (crossroadProperties) => {
        const newCrossroad = {
            type: 'Feature',
            properties: crossroadProperties,
            geometry: {
                type: 'Point',
                coordinates: [lng, lat],
            },
        };

        // Add the new crossroad feature to the crossRoads state
        setCrossRoads((prevCrossRoads) => [...prevCrossRoads, newCrossroad]);

        setShowForm(false);
    };

    const handleFormCancel = () => {
        setShowForm(false);
    };

    return (
        <div>
            <div ref={mapContainer} className="map-container" />
            {showForm && (
                <CustomDialog
                    title="New Crossroad"
                    content={
                        <CrossroadForm onSave={handleFormSave} onCancel={handleFormCancel} />
                    }
                    onClose={handleFormCancel}
                />
            )}
        </div>
    );
}

const CustomDialog = ({ title, content, onClose }) => {
    return (
        <div className="custom-dialog">
            <div className="dialog-header">
                <h2>{title}</h2>
                <button className="close-button" onClick={onClose}>
                    Close
                </button>
            </div>
            <div className="dialog-content">{content}</div>
        </div>
    );
};

const CrossroadForm = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');

    const handleSave = () => {
        const crossroadProperties = {
            name,
        };
        onSave(crossroadProperties);
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <div>
            <label>
                Crossroad Name:
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
        </div>
    );
};
