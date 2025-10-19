import React, { createContext, useContext, useReducer } from 'react';
// import { useStateTracker } from '../hooks/useStateTracker'; // Temporarily disabled for testing

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
  console.log('🔍 AppStateReducer:', action.type, action.payload);
  
  let newState;
  
  switch (action.type) {
    // Authentication actions
    case 'SET_AUTH_USER':
      newState = {
        ...state,
        auth: { ...state.auth, user: action.payload, isAuthenticated: !!action.payload }
      };
      break;
    
    case 'SET_CONNECTION_STATE':
      newState = {
        ...state,
        auth: { ...state.auth, connectionState: action.payload }
      };
      break;
    
    // Map mode management - CRITICAL FOR FIXING STATE ISSUES
    case 'SET_MAP_MODE':
      newState = {
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
          : { ...state.editMode, isActive: action.payload === 'EDIT' }
      };
      break;
    
    case 'SET_MAP_LOADED':
      newState = {
        ...state,
        map: { ...state.map, isLoaded: action.payload }
      };
      break;
    
    // Path network actions
    case 'SET_PATH_NETWORK':
      newState = {
        ...state,
        pathNetwork: { ...state.pathNetwork, segments: action.payload }
      };
      break;
    
    case 'SET_DESTINATIONS':
      newState = {
        ...state,
        pathNetwork: { ...state.pathNetwork, destinations: action.payload }
      };
      break;
    
    case 'SET_CROSSROADS':
      newState = {
        ...state,
        pathNetwork: { ...state.pathNetwork, crossroads: action.payload }
      };
      break;
    
    // Auto-segment actions
    case 'START_AUTO_SEGMENT':
      newState = {
        ...state,
        map: { ...state.map, mode: 'AUTO_SEGMENT' },
        autoSegment: { 
          ...state.autoSegment, 
          isActive: true, 
          selectedCrossroads: [] 
        }
      };
      break;
    
    case 'STOP_AUTO_SEGMENT':
      newState = {
        ...state,
        map: { ...state.map, mode: 'NORMAL' },
        autoSegment: initialState.autoSegment
      };
      break;
    
    case 'SELECT_CROSSROAD':
      newState = {
        ...state,
        autoSegment: {
          ...state.autoSegment,
          selectedCrossroads: [...state.autoSegment.selectedCrossroads, action.payload]
        }
      };
      break;
    
    case 'CLEAR_SELECTED_CROSSROADS':
      newState = {
        ...state,
        autoSegment: { ...state.autoSegment, selectedCrossroads: [] }
      };
      break;
    
    // Edit mode actions
    case 'SET_EDIT_MODE_SNAP1':
      newState = {
        ...state,
        editMode: { ...state.editMode, snap1: action.payload }
      };
      break;
    
    case 'SET_EDIT_MODE_SNAP2':
      newState = {
        ...state,
        editMode: { ...state.editMode, snap2: action.payload }
      };
      break;
    
    case 'SET_EDIT_MODE_COORDINATES':
      newState = {
        ...state,
        editMode: { ...state.editMode, tempCoordinates: action.payload }
      };
      break;
    
    // UI actions
    case 'SHOW_CROSSROAD_FORM':
      newState = {
        ...state,
        ui: { 
          ...state.ui, 
          showCrossroadForm: true, 
          formData: action.payload 
        }
      };
      break;
    
    case 'HIDE_CROSSROAD_FORM':
      newState = {
        ...state,
        ui: { ...state.ui, showCrossroadForm: false, formData: null }
      };
      break;
    
    case 'SHOW_PATH_FORM':
      newState = {
        ...state,
        ui: { 
          ...state.ui, 
          showPathForm: true, 
          formData: action.payload 
        }
      };
      break;
    
    case 'HIDE_PATH_FORM':
      newState = {
        ...state,
        ui: { ...state.ui, showPathForm: false, formData: null }
      };
      break;
    
    case 'SHOW_CONTEXT_MENU':
      newState = {
        ...state,
        ui: { 
          ...state.ui, 
          activeModal: 'CONTEXT_MENU',
          formData: action.payload 
        }
      };
      break;
    
    default:
      newState = state;
  }
  
  console.log('🔍 AppStateReducer - State changed:', {
    action: action.type,
    prevState: state,
    newState: newState
  });
  
  return newState;
}

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  // Track state changes
  useStateTracker('AppStateContext', state);
  
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
