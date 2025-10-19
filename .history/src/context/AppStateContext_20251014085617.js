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
  
  // Edit mode state - for segment creation
  editMode: {
    isActive: false,
    tempPoints: [],
    tempCoordinates: [],
    snap1: null,
    snap2: null,
    snapCrossRef: null
  },
  
  // UI state
  ui: {
    showCrossroadForm: false,
    showPathForm: false,
    formData: null,
    activeModal: null,
    // Context menu state
    showContextMenu: false,
    contextMenuPosition: null,
    contextMenuCoordinates: null
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
    
    // Data actions for render components
    case 'SET_PATH_NETWORK_DATA':
      return {
        ...state,
        pathNetwork: { ...state.pathNetwork, segments: action.payload }
      };
    
    case 'SET_DESTINATIONS_DATA':
      return {
        ...state,
        pathNetwork: { ...state.pathNetwork, destinations: action.payload }
      };
    
    case 'SET_CROSSROADS_DATA':
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
    
    // Context menu actions
    case 'SHOW_CONTEXT_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          showContextMenu: true,
          contextMenuPosition: action.payload.position,
          contextMenuCoordinates: action.payload.coordinates
        }
      };
    
    case 'HIDE_CONTEXT_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          showContextMenu: false,
          contextMenuPosition: null,
          contextMenuCoordinates: null
        }
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
