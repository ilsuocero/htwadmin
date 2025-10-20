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
export const useCrossRoadForm = (showForm, setShowForm, setCrossRoads, setDestNetwork, map, mapContainer, connectionState, selectedFeature) => {
    useEffect(() => {
        if (!showForm.show) return;
        
        // Dynamic form creation logic
        const crossRoadForm = document.createElement('div');
        // ... form setup and event handlers
        
        return () => {
            // Cleanup on unmount
            if (mapContainer.current && crossRoadForm.parentNode === mapContainer.current) {
                mapContainer.current.removeChild(crossRoadForm);
                selectedFeature.current = null;
            }
        };
    }, [showForm.show, showForm.coordinates]);
};
```

**Working Behavior**:
- Forms created dynamically as DOM elements
- Proper cleanup on component unmount
- State synchronization between form and map
- Conditional rendering based on showForm state

## Event Handling Patterns

### 12. Keyboard Shortcuts

**Pattern**: Document-Level Event Listeners

```javascript
// map.js - Keyboard event handling
const handleKeyDown = (e) => {
    if (editMode.current) {
        if (e.keyCode === 46) { // Delete
            cancelSegment();
        }
        if (e.keyCode === 83) { // S
            saveSegment();
        }
        if (e.keyCode === 81) { // Q
            quitSegment();
        }
    }
};

document.addEventListener('keydown', handleKeyDown);
```

**Working Behavior**:
- Global keyboard shortcuts for edit operations
- Context-aware (only in edit mode)
- Standard keys: S=Save, Q=Quit, Delete=Cancel last point
- Proper event listener cleanup

### 13. Map Event Coordination

**Pattern**: Mode-Based Event Registration

```javascript
// map.js - Conditional event handling
useEffect(() => {
    if (!editMODE) {
        map.current.on('contextmenu', handleContextMenu);
    }
    if (editMODE) {
        map.current.off('contextmenu', handleContextMenu);
        map.current.on('click', handleMapClick);
    }
    
    return () => {
        map.current.off('contextmenu', handleContextMenu);
        map.current.off('click', handleMapClick);
    };
}, [editMODE]);
```

**Working Behavior**:
- Different event sets for normal vs edit modes
- Automatic event cleanup on mode changes
- Prevention of event handler conflicts
- Context menu disabled in edit mode

## Key Working Examples

### 14. Complete Segment Creation Flow

```javascript
// Working segment creation sequence
1. Right-click → "New Segment" → enters edit mode
2. Hover over destination/crossroad → visual snap feedback
3. Click to set start point (snap1)
4. Click intermediate points (optional)
5. Hover over end destination/crossroad → visual snap feedback  
6. Click to set end point (snap2)
7. Press 'S' to save → opens segment form
8. Fill form → saves to database → updates map
```

### 15. Feature Update Flow

```javascript
// Working feature update sequence  
1. Drag feature to new position
2. Mouse up triggers form opening
3. Form pre-populated with existing data
4. Submit updates database and map state
5. Real-time visual feedback throughout process
```

### 16. Multi-language POI Support

```javascript
// crossRoadForm.js - POI description handling
if (['POI', 'POIdest'].includes(typeInput.value)) {
    // Show extended form for multi-language descriptions
    crossRoadForm.style.width = '98%';
    crossRoadForm.style.height = '100%';
    
    // Load existing descriptions if updating
    getDescriptions(idInput.value, PRIMARY_LANGUAGE, SECONDARY_LANGUAGE);
}
```

**Working Behavior**:
- POI types trigger expanded form with description fields
- Multi-language support (English/Italian)
- Validation for minimum description lengths
- Automatic description loading for updates

## Critical Success Patterns

### 17. State Synchronization

**Pattern**: Immediate Visual Feedback with Database Sync

```javascript
// Immediate visual update pattern
// 1. Update local state immediately
setPathNetwork(prev => ({...prev, features: [...prev.features, newSegment]}));

// 2. Sync to database in background
socket.emit('saveSegment', newSegment);
socket.on('segmentSaved', handleErrors);
```

### 18. Error Recovery

**Pattern**: Graceful Failure Handling

```javascript
// Error handling pattern
try {
    const socket = await emitEvent(connectionState, 'saveCrossRoad', newFeature);
    socket.on('crossRoadSaved', (err) => {
        if (!err) {
            // Success logic
        } else {
            alert('Something went wrong:', err);
            // Optionally revert local changes
        }
    });
} catch (error) {
    alert('Something went wrong:', error);
    console.error(error);
}
```

### 19. Performance Optimization

**Pattern**: Single Source Updates

```javascript
// Efficient map updates
if (!map.current.getSource('sentieri')) {
    // Initial setup
    map.current.addSource('sentieri', { type: 'geojson', data: pathNetwork });
    map.current.addLayer({ id: 'sentieri', type: 'line', source: 'sentieri' });
} else {
    // Update existing source
    map.current.getSource('sentieri').setData(pathNetwork);
}
```

## Summary of Working Behaviors to Preserve - SUCCESSFULLY IMPLEMENTED ✅

1. **Authentication Flow**: ✅ Firebase → JWT → Socket.io with single instance
2. **Data Loading**: ✅ Render components with socket event patterns
3. **Map Interactions**: ✅ Context menu, hover effects, click handling
4. **Edit Mode**: ✅ Visual states, snapping, keyboard shortcuts  
5. **Form Management**: ✅ CrossRoadForm with proper cleanup and validation
6. **State Synchronization**: ✅ Immediate visual feedback with async DB sync
7. **Error Handling**: ✅ Graceful failure with user feedback
8. **Multi-language Support**: ✅ POI descriptions in multiple languages
9. **Feature Types**: ✅ Proper routing based on feature type (destination vs crossroad)
10. **Event Management**: ✅ "Father State" pattern for stable event handling

## Recent Successes - Core Issues RESOLVED ✅

### Hover Functionality - FIXED
- **Dynamic Paint Properties**: ✅ MapLibre GL paint properties with conditional expressions
- **Function Hoisting**: ✅ Hover handlers defined before setup functions
- **Layer Coordination**: ✅ Event handlers only set up when layers available
- **All Features Covered**: ✅ Segments, destinations, and crossroads all have hover effects

### Click Handling - FIXED  
- **Segment Clicks**: ✅ Shows segment information in alerts
- **Destination Clicks**: ✅ Opens CrossRoadForm for editing
- **Crossroad Clicks**: ✅ Opens CrossRoadForm for editing
- **Event Consolidation**: ✅ All click handlers managed by "Father State"

### CrossRoad Editing - FIXED
- **Complete CrossRoadForm**: ✅ Full-featured Material-UI dialog
- **Multi-language Support**: ✅ English/Italian descriptions for POI types
- **Form Validation**: ✅ Character length requirements and field validation
- **Socket Integration**: ✅ Real-time save operations with error handling

### Event Management - FIXED
- **"Father State" Pattern**: ✅ Single source of truth for all event handlers
- **Proper Cleanup**: ✅ Event handlers properly removed and re-added
- **No Race Conditions**: ✅ Coordinated effect system prevents duplication
- **Mode Coordination**: ✅ Smooth transitions between NORMAL and EDIT modes

