# Reference Implementation - htwadmin

This document captures the working behaviors, patterns, and interactions from the backup implementation that should be preserved and replicated in the new structure. Focus is on **HOW things work** rather than file organization.

## Core Working Functionalities

### 1. Authentication Flow

**Pattern**: Firebase → Backend API → Socket Authentication

```javascript
// AppAuth.js - Authentication sequence
Firebase User → Backend API (JWT) → Socket.io Connection
```

**Working Behavior**:
- User authenticates via Firebase
- AppAuth component exchanges Firebase UID for JWT token from backend
- JWT token used for socket.io authentication
- Connection state managed with `isOnline`, `tokenIO`, and `roles` properties

**Key Success Factors**:
- Single authentication flow from Firebase to socket
- JWT token management for secure socket connections
- Connection state propagation to all components

### 2. Socket.io Architecture

**Pattern**: Single Instance with Centralized Management

```javascript
// sockets.ts - Single socket instance pattern
let socketInstance = null;

export const emitEvent = async (connectionState, eventName, ...args) => {
    if (!socketInstance) {
        socketInstance = io(ENV.SERVER, {
            auth: { token: `Bearer ${connectionState.tokenIO}` }
        });
    }
    socketInstance.emit(eventName, ...args);
    return socketInstance;
};
```

**Working Behavior**:
- Single socket instance prevents connection chaos
- Authentication token passed in socket connection
- Event emission with acknowledgment support
- Connection state validation before operations

**Event Naming Convention**:
- Request: `listaSentieri` → Response: `printSentieri`
- Request: `listaDestinazioni` → Response: `printDestinazioni` 
- Request: `listaIncroci` → Response: `printIncroci`

### 3. Data Loading Pattern

**Pattern**: Render Components for Data Fetching

```javascript
// RenderPathNetwork.js - Data loading pattern
React.useEffect(() => {
    const fetchSentieri = async () => {
        const socket = await emitEvent(connectionState, 'listaSentieri');
        socket.on('printSentieri', (data) => {
            const sentieri = {
                "type": "FeatureCollection",
                "features": data
            };
            setPathNetwork(sentieri);
        });
    };
    if (connectionState) fetchSentieri();
}, []);
```

**Working Behavior**:
- Dedicated render components for each data type
- Socket events trigger data updates
- GeoJSON FeatureCollection format for map compatibility
- Automatic cleanup of event listeners

## Visual Behavior & UI Interactions

### 4. Map Context Menu System

**Pattern**: Dynamic DOM Element Creation

```javascript
// map.js - Context menu creation
const showContextMenu = (coordinates) => {
    const contextMenu = document.createElement('div');
    contextMenu.className = 'custom-context-menu';
    
    // Position near clicked coordinates
    const pos = map.current.project(coordinates).add(new Point(offsetX, offsetY));
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = pos.x + 'px';
    contextMenu.style.top = pos.y + 'px';
    
    // Menu options
    const entry1 = document.createElement('div');
    entry1.innerHTML = 'New Crossroad';
    entry1.addEventListener('click', () => {
        setShowForm({ show: true, coordinates });
        removeContextMenu();
    });
};
```

**Working Behavior**:
- Right-click triggers custom context menu
- Menu positioned at click coordinates
- Options: "New Crossroad", "New Segment"
- Automatic cleanup with Escape key or outside click

### 5. Hover Effects & Visual Feedback

**Pattern**: Dynamic Paint Property Updates

```javascript
// map.js - Hover effects
const mouseEnterSentieri = useCallback((e) => {
    var featureId = e.features[0].properties.id;
    
    map.current.setPaintProperty('sentieri', 'line-color', [
        'case',
        ['==', ['get', 'id'], featureId],
        ENV.PATH_OVER, // Highlight color
        ENV.PATH,      // Default color
    ]);
    
    map.current.getCanvas().style.cursor = 'pointer';
}, []);
```

**Working Behavior**:
- Features highlight on hover with different colors
- Cursor changes to pointer for interactive elements
- Color changes managed through MapLibre paint properties
- Automatic reset on mouse leave

### 6. Edit Mode Visual States

**Pattern**: Cursor and Interaction Mode Changes

```javascript
// map.js - Edit mode visual feedback
function newSegment() {
    editMode.current = true;
    setEditMODE(true);
    map.current.getCanvas().style.cursor = 'crosshair';
    
    // Add temporary layers for editing
    map.current.addSource('tempLineSource', { type: 'geojson', data: {} });
    map.current.addLayer({ id: 'tempLineLayer', type: 'line', source: 'tempLineSource' });
}
```

**Working Behavior**:
- Crosshair cursor indicates drawing mode
- Temporary layers for in-progress edits
- Visual feedback for snapping to existing features
- Keyboard shortcuts for operations (S=Save, Q=Quit, Delete=Cancel)

## Business Logic Patterns

### 7. Feature Creation & Management

**Pattern**: Form-Based Feature Creation

```javascript
// crossRoadForm.js - Feature creation flow
const saveCrossRoad = async (newFeature, selectedFeature) => {
    const socket = await emitEvent(connectionState, 'saveCrossRoad', newFeature);
    socket.on('crossRoadSaved', (err) => {
        if (!err) {
            // Add to appropriate state based on type
            if (['destinazione', 'POIdest'].includes(newFeature.properties.Tipo)) {
                setDestNetwork(prev => ({...prev, features: [...prev.features, newFeature]}));
            } else {
                setCrossRoads(prev => ({...prev, features: [...prev.features, newFeature]}));
            }
        }
    });
};
```

**Working Behavior**:
- Dynamic forms based on feature type
- Automatic UUID generation for new features
- Type-based routing to appropriate state (destinations vs crossroads)
- Real-time database synchronization

### 8. Segment Creation with Snapping

**Pattern**: Vertex Snapping for Path Creation

```javascript
// map.js - Segment snapping behavior
function handleMapClick(e) {
    if (snapCrossRef.current) {
        const { clickedCoordinates, featureId } = snapCrossRef.current;
        clickedCoords = clickedCoordinates;
        
        if (!snap1.current) {
            snap1.current = { clickedCoords, featureId }
        } else {
            snap2.current = { clickedCoords, featureId }
        }
    }
}
```

**Working Behavior**:
- Segments must start/end at existing features (destinations/crossroads)
- Automatic snapping to nearest feature on hover
- Visual feedback for valid snapping targets
- Validation to ensure proper segment connections

### 9. Drag & Drop Feature Editing

**Pattern**: Mouse Event-Based Dragging

```javascript
// map.js - Feature dragging
const dragFeature = useCallback((e) => {
    if (selectedFeature.current && e.originalEvent.buttons === 1) {
        var coords = e.lngLat;
        const newCoordinates = [coords.lng, coords.lat];
        
        // Update feature coordinates in real-time
        selectedFeature.current.geometry.updateCoords = newCoordinates;
        
        // Update source data
        const source = map.current.getSource(selectedFeature.current.source);
        const updatedFeatures = featureCollection.features.map((feature) => {
            if (feature.properties.id === selectedFeature.current.properties.id) {
                return { ...feature, geometry: { ...feature.geometry, coordinates: newCoordinates } };
            }
            return feature;
        });
        source.setData({ ...featureCollection, features: updatedFeatures });
    }
}, []);
```

**Working Behavior**:
- Features can be dragged to new positions
- Real-time visual updates during drag
- Mouse button state tracking for drag operations
- Automatic form opening after drag completion for updates

## Component Interactions

### 10. Parent-Child Data Flow

**Pattern**: Props-Based State Management

```javascript
// Home.js - Centralized state management
<AppAuth user={user} setConnectionState={setConnectionState} setAuthenticated={setAuthenticated} />
<RenderPathNetwork connectionState={connectionState} setPathNetwork={setPathNetwork} />
<RenderDestinations connectionState={connectionState} setDestNetwork={setDestNetwork} />
<Map
    pathNetwork={pathNetwork}
    destNetwork={destNetwork}
    crossRoads={crossRoads}
    setCrossRoads={setCrossRoads}
    setPathNetwork={setPathNetwork}
    setDestNetwork={setDestNetwork}
    connectionState={connectionState}
/>
```

**Working Behavior**:
- Home component acts as central coordinator
- Render components fetch and set data
- Map component receives all data and setter functions
- Authentication gates component rendering

### 11. Hook-Based Form Management

**Pattern**: Custom Hooks for Complex UI Logic

```javascript
// crossRoadForm.js - Hook-based form management
