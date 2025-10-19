# HtW Admin - Specific Project Refactoring Plan

## Current Project Analysis

Based on the analysis of your repository at https://github.com/ilsuocero/htwadmin, I've identified the following current structure and issues:

### Current Structure
```
src/
├── components/
│   ├── AppAuth.js              # Authentication component
│   ├── map.js                  # Large, complex map component (>1000 lines)
│   ├── navbar.js               # Navigation bar
│   ├── CrossRoadForm.tsx       # Form for crossroads
│   ├── PathForm.tsx            # Form for path segments
│   ├── RenderPathNetwork.js    # Path network renderer
│   ├── RenderDestinations.js   # Destinations renderer
│   ├── RenderCrossRoads.js     # Crossroads renderer
│   └── sockets.ts              # Socket utilities
├── hooks/
│   └── useSocket.js            # Socket management hook
├── services/
│   ├── socketService.js        # Socket service singleton
│   ├── osrmService.ts          # OSRM routing service
│   └── api.ts                  # API utilities
├── page/
│   ├── Home.js                 # Main application page
│   ├── Login.js                # Login page
│   └── Signup.js               # Signup page
└── types/
    └── geojson.ts              # TypeScript types
```

### Identified Critical Issues

1. **Massive Map Component**: The `map.js` file is over 1000+ lines with mixed concerns
2. **State Management Chaos**: Multiple useState hooks scattered across components
3. **Event Handler Conflicts**: The centralized useEffect for map behavior conflicts with itself
4. **Mode Management Issues**: Auto-segment mode, edit mode, and normal mode fight each other
5. **Props Drilling**: Excessive prop passing between components
6. **Mixed TypeScript/JavaScript**: Inconsistent language usage

## Phase-by-Phase Refactoring Plan

### Phase 1: Critical State Management Fix (Week 1)

#### Step 1.1: Create Global State Context
**Priority: CRITICAL - This fixes the core state loss issues**

Create `src/context/AppStateContext.js`:
```javascript
import React, { createContext, useContext, useReducer } from 'react';

// Define all possible actions
const AppStateContext = createContext();

const initialState = {
  // Authentication state
  auth: {
    user: null,
    isAuthenticated: false,
    connectionState: {
      tokenIO: '',
      roles: [],
      isOnline: false
    }
  },
  
  // Map state - centralized map mode management
  map: {
    mode: 'NORMAL', // NORMAL, EDIT, AUTO_SEGMENT
    center: [9.49709, 44.88096],
    zoom: 14,
    isLoaded: false,
    selectedFeature: null,
    isDragging: false
  },
  
  // Path network data
  pathNetwork: {
    segments: null,
    destinations: null,
    crossroads: null,
    isLoading: false,
    error: null
  },
  
  // Auto-segment specific state
  autoSegment: {
    isActive: false,
    selectedCrossroads: [],
    isLoadingOSRM: false,
    tempRoute: null
  },
  
  // Edit mode state
  editMode: {
    isActive: false,
    tempPoints: [],
    tempCoordinates: [],
    snap1: null,
    snap2: null
  },
  
  // UI state
  ui: {
    showCrossroadForm: false,
    showPathForm: false,
    formData: null,
    activeModal: null
  }
};

function appStateReducer(state, action) {
  switch (action.type) {
    // Authentication actions
    case 'SET_AUTH_USER':
      return {
        ...state,
        auth: { ...state.auth, user: action.payload, isAuthenticated: !!action.payload }
      };
    
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        auth: { ...state.auth, connectionState: action.payload }
      };
    
    // Map mode management - CRITICAL FOR FIXING STATE ISSUES
    case 'SET_MAP_MODE':
      return {
        ...state,
        map: { 
          ...state.map, 
          mode: action.payload,
          selectedFeature: action.payload === 'NORMAL' ? null : state.map.selectedFeature
        },
        // Reset conflicting states when changing modes
        autoSegment: action.payload !== 'AUTO_SEGMENT' 
          ? { ...initialState.autoSegment } 
          : state.autoSegment,
        editMode: action.payload !== 'EDIT' 
          ? { ...initialState.editMode } 
          : { ...state.editMode, isActive: true }
      };
    
    case 'SET_MAP_LOADED':
      return {
        ...state,
        map: { ...state.map, isLoaded: action.payload }
      };
    
    // Path network actions
    case 'SET_PATH_NETWORK':
      return {
        ...state,
        pathNetwork: { ...state.pathNetwork, segments: action.payload }
      };
    
    case 'SET_DESTINATIONS':
      return {
        ...state,
        pathNetwork: { ...state.pathNetwork, destinations: action.payload }
      };
    
    case 'SET_CROSSROADS':
      return {
        ...state,
        pathNetwork: { ...state.pathNetwork, crossroads: action.payload }
      };
    
    // Auto-segment actions
    case 'START_AUTO_SEGMENT':
      return {
        ...state,
        map: { ...state.map, mode: 'AUTO_SEGMENT' },
        autoSegment: { 
          ...state.autoSegment, 
          isActive: true, 
          selectedCrossroads: [] 
        }
      };
    
    case 'STOP_AUTO_SEGMENT':
      return {
        ...state,
        map: { ...state.map, mode: 'NORMAL' },
        autoSegment: initialState.autoSegment
      };
    
    case 'SELECT_CROSSROAD':
      return {
        ...state,
        autoSegment: {
          ...state.autoSegment,
          selectedCrossroads: [...state.autoSegment.selectedCrossroads, action.payload]
        }
      };
    
    case 'CLEAR_SELECTED_CROSSROADS':
      return {
        ...state,
        autoSegment: { ...state.autoSegment, selectedCrossroads: [] }
      };
    
    // UI actions
    case 'SHOW_CROSSROAD_FORM':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          showCrossroadForm: true, 
          formData: action.payload 
        }
      };
    
    case 'HIDE_CROSSROAD_FORM':
      return {
        ...state,
        ui: { ...state.ui, showCrossroadForm: false, formData: null }
      };
    
    case 'SHOW_PATH_FORM':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          showPathForm: true, 
          formData: action.payload 
        }
      };
    
    case 'HIDE_PATH_FORM':
      return {
        ...state,
        ui: { ...state.ui, showPathForm: false, formData: null }
      };
    
    default:
      return state;
  }
}

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};
```

#### Step 1.2: Update App.js to Use Context
```javascript
// src/App.js
import React from 'react';
import './App.css';
import Home from './page/Home';
import Signup from './page/Signup';
import Login from './page/Login';
import POIedit from './page/POIedit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { queryClient } from './services/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider } from './context/AppStateContext'; // ADD THIS

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider> {/* WRAP WITH STATE PROVIDER */}
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/POIedit" element={<POIedit />} />
          </Routes>
        </Router>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Phase 2: Fix Navigation State Issues (Week 1)

#### Step 2.1: Refactor Navbar Component
Create `src/components/navigation/NavbarContainer.js`:
```javascript
import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Navbar } from './Navbar';

export const NavbarContainer = ({ name, email }) => {
  const { state, dispatch } = useAppState();
  
  const handleAutoSegmentClick = () => {
    console.log('NavbarContainer: Auto segment clicked');
    
    if (state.map.mode === 'AUTO_SEGMENT') {
      dispatch({ type: 'STOP_AUTO_SEGMENT' });
    } else {
      dispatch({ type: 'START_AUTO_SEGMENT' });
    }
  };
  
  const handleEditModeClick = () => {
    console.log('NavbarContainer: Edit mode clicked');
    
    if (state.map.mode === 'EDIT') {
      dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
    } else {
      dispatch({ type: 'SET_MAP_MODE', payload: 'EDIT' });
    }
  };
  
  return (
    <Navbar
      name={name}
      email={email}
      currentMode={state.map.mode}
      isAutoSegmentActive={state.autoSegment.isActive}
      isEditModeActive={state.editMode.isActive}
      onAutoSegmentClick={handleAutoSegmentClick}
      onEditModeClick={handleEditModeClick}
    />
  );
};
```

Create `src/components/navigation/Navbar.js`:
```javascript
import React, { memo } from 'react';
import { logout } from "../firebase";
import './navbar.css';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import GestureIcon from '@mui/icons-material/Gesture';
import RouteIcon from '@mui/icons-material/Route';
import Tooltip from '@mui/material/Tooltip';

export const Navbar = memo(({ 
  name, 
  email, 
  currentMode,
  isAutoSegmentActive,
  isEditModeActive,
  onAutoSegmentClick,
  onEditModeClick 
}) => {
  console.log('Navbar render - currentMode:', currentMode);
  
  return (
    <div className="navbar">
      <div className="navbar-header">
        <h2>Hike the World - Admin</h2>
      </div>
      
      <div className="navbar-actions">
        {/* Mode buttons with stable state */}
        <Tooltip title="Auto Segment Mode">
          <button
            className={`nav-button ${isAutoSegmentActive ? 'active' : ''}`}
            onClick={onAutoSegmentClick}
            type="button"
          >
            <RouteIcon />
            Auto Segment
          </button>
        </Tooltip>
        
        <Tooltip title="Edit Mode">
          <button
            className={`nav-button ${isEditModeActive ? 'active' : ''}`}
            onClick={onEditModeClick}
            type="button"
          >
            <GestureIcon />
            Edit Mode
          </button>
        </Tooltip>
        
        {/* Other action buttons */}
        <Tooltip title="Save">
          <button className="nav-button" type="button">
            <SaveIcon />
          </button>
        </Tooltip>
        
        <Tooltip title="Cancel">
          <button className="nav-button" type="button">
            <CancelIcon />
          </button>
        </Tooltip>
        
        <Tooltip title="Delete">
          <button className="nav-button" type="button">
            <DeleteIcon />
          </button>
        </Tooltip>
      </div>
      
      <div className="navbar-user">
        <span>Logged in as: {name}</span>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
});
```

### Phase 3: Break Down the Massive Map Component (Week 2)

#### Step 3.1: Create Map Component Architecture
Create the following components:

**`src/components/map/MapContainer.js`** - Main container
```javascript
import React, { useRef } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { MapView } from './MapView';
import { useMapBehavior } from '../../hooks/useMapBehavior';
import { CrossroadForm } from '../forms/CrossroadForm';
import { PathForm } from '../forms/PathForm';

export const MapContainer = ({
  pathNetwork,
  destNetwork,
  crossRoads,
  setCrossRoads,
  setPathNetwork,
  setDestNetwork,
  connectionState,
  socketOperations,
  isConnected
}) => {
  const mapRef = useRef(null);
  const { state, dispatch } = useAppState();
  
  // Custom hook to manage all map behavior based on current mode
  const {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  } = useMapBehavior(mapRef, state.map.mode);
  
  return (
    <>
      <MapView
        ref={mapRef}
        pathNetwork={pathNetwork}
        destNetwork={destNetwork}
        crossRoads={crossRoads}
        onMapClick={handleMapClick}
        onMapMouseDown={handleMapMouseDown}
        onMapMouseMove={handleMapMouseMove}
        onMapMouseUp={handleMapMouseUp}
        onContextMenu={handleContextMenu}
        currentMode={state.map.mode}
      />
      
      <CrossroadForm
        open={state.ui.showCrossroadForm}
        onClose={() => dispatch({ type: 'HIDE_CROSSROAD_FORM' })}
        formData={state.ui.formData}
        connectionState={connectionState}
        socketOperations={socketOperations}
        isConnected={isConnected}
      />
      
      <PathForm
        open={state.ui.showPathForm}
        onClose={() => dispatch({ type: 'HIDE_PATH_FORM' })}
        formData={state.ui.formData}
        connectionState={connectionState}
        socketOperations={socketOperations}
        isConnected={isConnected}
      />
    </>
  );
};
```

**`src/hooks/useMapBehavior.js`** - Centralized behavior management
```javascript
import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';

export const useMapBehavior = (mapRef, currentMode) => {
  const { state, dispatch } = useAppState();
  
  const handleMapClick = useCallback((e) => {
    console.log('Map clicked in mode:', currentMode);
    
    switch (currentMode) {
      case 'NORMAL':
        // Handle normal click behavior
        break;
        
      case 'EDIT':
        // Handle edit mode click
        handleEditModeClick(e);
        break;
        
      case 'AUTO_SEGMENT':
        // Handle auto-segment mode click
        handleAutoSegmentClick(e);
        break;
        
      default:
        break;
    }
  }, [currentMode]);
  
  const handleEditModeClick = useCallback((e) => {
    // Add point to current segment
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    // Implementation for edit mode...
  }, []);
  
  const handleAutoSegmentClick = useCallback((e) => {
    // Handle crossroad selection for auto-segment
    const feature = e.features?.[0];
    if (feature && (feature.source === 'destinazioni' || feature.source === 'incroci')) {
      dispatch({ type: 'SELECT_CROSSROAD', payload: feature });
    }
  }, [dispatch]);
  
  const handleMapMouseDown = useCallback((e) => {
    // Handle mouse down based on current mode
  }, [currentMode]);
  
  const handleMapMouseMove = useCallback((e) => {
    // Handle mouse move based on current mode
  }, [currentMode]);
  
  const handleMapMouseUp = useCallback((e) => {
    // Handle mouse up based on current mode
  }, [currentMode]);
  
  const handleContextMenu = useCallback((e) => {
    if (currentMode === 'NORMAL') {
      e.preventDefault();
      dispatch({ 
        type: 'SHOW_CROSSROAD_FORM', 
        payload: { coordinates: e.lngLat } 
      });
    }
  }, [currentMode, dispatch]);
  
  return {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  };
};
```

### Phase 4: Update Home Component (Week 2)

#### Step 4.1: Simplify Home.js
```javascript
// src/page/Home.js
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { auth, db } from "../components/firebase";
import { query, collection, getDocs, where } from "firebase/firestore";
import { MapContainer } from '../components/map/MapContainer';  // Updated import
import { NavbarContainer } from '../components/navigation/NavbarContainer';  // Updated import
import AppAuth from '../components/AppAuth';
import RenderPathNetwork from '../components/RenderPathNetwork';
import RenderDestinations from '../components/RenderDestinations';
import RenderCrossRoads from "../components/RenderCrossRoads";
import { useSocket } from '../hooks/useSocket';
import { useAppState } from '../context/AppStateContext';  // ADD THIS

function Home() {
  const { state, dispatch } = useAppState();  // ADD THIS
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  
  // Move state to context - these will be removed
  const [pathNetwork, setPathNetwork] = useState(null);
  const [destNetwork, setDestNetwork] = useState(null);
  const [crossRoads, setCrossRoads] = useState(null);
  
  // Socket connection - simplified
  const {
    socket,
    isConnected,
    isConnecting,
    error: socketError,
    socketOperations
  } = useSocket(state.auth.connectionState);
  
  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      setName(data.name);
      dispatch({ type: 'SET_AUTH_USER', payload: user });
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };
  
  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");
    fetchUserName();
  }, [user, loading, error]);
  
  return (
    <div className="home">
      <AppAuth 
        setConnectionState={(connectionState) => 
          dispatch({ type: 'SET_CONNECTION_STATE', payload: connectionState })
        }
        setAuthenticated={(authenticated) => 
          dispatch({ type: 'SET_AUTH_USER', payload: authenticated ? user : null })
        } 
      />
      
      {state.auth.isAuthenticated && (
        <>
          <NavbarContainer name={name} email={user?.email} />
          
          <RenderPathNetwork 
            connectionState={state.auth.connectionState}
            setPathNetwork={setPathNetwork}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
          
          <RenderDestinations 
            connectionState={state.auth.connectionState}
            setDestNetwork={setDestNetwork}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
          
          <RenderCrossRoads 
            connectionState={state.auth.connectionState}
            setCrossRoads={setCrossRoads}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
          
          <MapContainer
            pathNetwork={pathNetwork}
            destNetwork={destNetwork}
            crossRoads={crossRoads}
            setCrossRoads={setCrossRoads}
            setPathNetwork={setPathNetwork}
            setDestNetwork={setDestNetwork}
            connectionState={state.auth.connectionState}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
        </>
      )}
      
      {!state.auth.isAuthenticated && (
        <div>Please authenticate to continue.</div>
      )}
    </div>
  );
}

export default Home;
```

### Phase 5: Implementation Steps

#### Week 1 Tasks:
1. **Day 1-2**: Create `AppStateContext.js` and test with simple state
2. **Day 3-4**: Update `App.js` and test context provider
3. **Day 5-7**: Refactor navbar component and test button state persistence

#### Week 2 Tasks:
1. **Day 1-3**: Break down map component into smaller pieces
2. **Day 4-5**: Create `useMapBehavior` hook
3. **Day 6-7**: Update Home component and test integration

#### Testing Strategy:
1. **After each step**: Test that buttons maintain state after clicks
2. **After navbar refactor**: Verify auto-segment button works consistently
3. **After map refactor**: Test mode switching and event handling
4. **Final test**: Complete workflow from authentication to segment creation

### Phase 6: Additional Improvements (Week 3)

#### Step 6.1: Performance Optimizations
- Add React.memo to prevent unnecessary re-renders
- Optimize map layer updates
- Implement proper event listener cleanup

#### Step 6.2: Error Boundaries
- Add error boundaries around major components
- Implement better error handling for socket connections
- Add loading states and user feedback

## Quick Wins You Can Start Today

1. **Create the Context**: Start with just the `AppStateContext.js` file
2. **Test State Persistence**: Wrap your app and test if button states persist
3. **Fix Navbar**: Update navbar to use context state instead of props
4. **Remove Auto-Segment Ref Logic**: Replace with context-based state management

## Expected Results After Refactoring

✅ **Buttons maintain state after interactions**  
✅ **No more conflicting event handlers**  
✅ **Consistent mode management**  
✅ **Simplified component logic**  
✅ **Better performance with proper re-render control**  
✅ **Easier debugging and maintenance**

This plan addresses your specific issues:
1. **State loss after first interaction** → Fixed by centralized state management
2. **Navbar buttons losing functionality** → Fixed by stable event handlers
3. **Auto-segment mode conflicts** → Fixed by proper mode management
4. **Centralized logic problems** → Fixed by component separation

Would you like me to create any specific component files to get you started?