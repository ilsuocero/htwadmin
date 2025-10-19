// src/page/Home.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { auth, db } from "../components/firebase";
import { query, collection, getDocs, where } from "firebase/firestore";
import { MapContainer } from '../components/map/MapContainer';  // Updated import
import { NavbarContainer } from '../components/navigation/NavbarContainer';  // Updated import
import AppAuth from '../components/AppAuth';
import ContextMenu from '../components/ContextMenu';
import RenderPathNetwork from '../components/RenderPathNetwork';
import RenderDestinations from '../components/RenderDestinations';
import RenderCrossRoads from "../components/RenderCrossRoads";
import { useSocket } from '../hooks/useSocket';
import { useAppState } from '../context/AppStateContext';  // ADD THIS
import { useSimpleMapBehavior } from '../hooks/useSimpleMapBehavior';

function Home() {
  const { state, dispatch } = useAppState();
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const mapRef = useRef(null);
  
  // Socket connection - simplified
  const {
    socket,
    isConnected,
    isConnecting,
    error: socketError,
    socketOperations
  } = useSocket(state.auth.connectionState);
  
  // Get cancelEditing function from useSimpleMapBehavior
  const { cancelEditing } = useSimpleMapBehavior(mapRef, state.map.mode);
  
  // Centralized ESC key handler for mode-specific cancellation
  const handleKeyDown = useCallback((e) => {
    console.log('🏠 HOME: Key pressed:', e.key, 'currentMode:', state.map.mode);
    
    if (e.key === 'Escape') {
      console.log('🏠 HOME: ESC key pressed, current mode:', state.map.mode);
      
      switch (state.map.mode) {
        case 'EDIT':
          console.log('🏠 HOME: ESC in EDIT mode - calling cancelEditing');
          e.preventDefault();
          cancelEditing();
          break;
        case 'AUTO_SEGMENT':
          console.log('🏠 HOME: ESC in AUTO_SEGMENT mode - implement auto-segment cancellation');
          // TODO: Add auto-segment cancellation logic here
          break;
        default:
          console.log('🏠 HOME: ESC in', state.map.mode, 'mode - no specific action');
          break;
      }
    }
  }, [state.map.mode, cancelEditing]);
  
  // Set up global ESC key listener
  useEffect(() => {
    console.log('🏠 HOME: Setting up global ESC key listener');
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('🏠 HOME: Cleaning up global ESC key listener');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
          <RenderPathNetwork 
            connectionState={state.auth.connectionState}
            dispatch={dispatch}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
          
          <RenderDestinations 
            connectionState={state.auth.connectionState}
            dispatch={dispatch}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
          
          <RenderCrossRoads 
            connectionState={state.auth.connectionState}
            dispatch={dispatch}
            socketOperations={socketOperations}
            isConnected={isConnected}
          />
          
          <MapContainer
            pathNetwork={state.pathNetwork.segments}
            destNetwork={state.pathNetwork.destinations}
            crossRoads={state.pathNetwork.crossroads}
            connectionState={state.auth.connectionState}
            socketOperations={socketOperations}
            isConnected={isConnected}
            cancelEditing={cancelEditing}
          />
          
          {state.ui.showContextMenu && (
            <ContextMenu
              position={state.ui.contextMenuPosition}
              onClose={() => dispatch({ type: 'HIDE_CONTEXT_MENU' })}
              onNewCrossroad={() => {
                dispatch({ 
                  type: 'SHOW_CROSSROAD_FORM', 
                  payload: { coordinates: state.ui.contextMenuCoordinates } 
                });
                dispatch({ type: 'HIDE_CONTEXT_MENU' });
              }}
              onNewSegment={() => {
                dispatch({ type: 'SET_MAP_MODE', payload: 'EDIT' });
                dispatch({ type: 'HIDE_CONTEXT_MENU' });
              }}
            />
          )}
        </>
      )}
      
      {!state.auth.isAuthenticated && (
        <div>Please authenticate to continue.</div>
      )}
    </div>
  );
}

export default Home;
