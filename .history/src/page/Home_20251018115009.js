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
import { useEditModeManager } from '../hooks/useEditModeManager';

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
  
  // Use the new edit mode manager (father state)
  const getMap = () => mapRef.current?.getMap();
  
  // Debug: Check if mapRef is available
  useEffect(() => {
    console.log('🏠 HOME: Map ref status', {
      hasMapRef: !!mapRef.current,
      hasMap: mapRef.current?.getMap ? !!mapRef.current.getMap() : false,
      getMapResult: mapRef.current?.getMap ? mapRef.current.getMap() : 'no getMap method'
    });
  }, [mapRef]);
  
  // Get cancelEditing function from the manager
  const { cancelEditing, publicCurrentMode } = editModeManager || {};
  
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
  
  // Set up global ESC key listener - only set up once
  useEffect(() => {
    console.log('🏠 HOME: Setting up global ESC key listener');
    
    const handleKeyDownStable = (e) => {
      console.log('🏠 HOME: Key pressed (stable):', e.key, 'currentMode:', state.map.mode);
      
      if (e.key === 'Escape') {
        console.log('🏠 HOME: ESC key pressed (stable), current mode:', state.map.mode);
        
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
    };
    
    document.addEventListener('keydown', handleKeyDownStable);
    
    return () => {
      console.log('🏠 HOME: Cleaning up global ESC key listener');
      document.removeEventListener('keydown', handleKeyDownStable);
    };
  }, [state.map.mode, cancelEditing]); // Dependencies ensure we always have latest state
  
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
        user={user}
        setConnectionState={(connectionState) => 
          dispatch({ type: 'SET_CONNECTION_STATE', payload: connectionState })
        }
        setAuthenticated={(authenticated) => 
          dispatch({ type: 'SET_AUTH_USER', payload: authenticated ? user : null })
        } 
      />
      
      {state.auth.isAuthenticated && (
        <>
          <NavbarContainer name={name} email={user?.email} cancelEditing={cancelEditing} />
          
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
            ref={mapRef}
            pathNetwork={state.pathNetwork.segments}
            destNetwork={state.pathNetwork.destinations}
            crossRoads={state.pathNetwork.crossroads}
            connectionState={state.auth.connectionState}
            socketOperations={socketOperations}
            isConnected={isConnected}
            cancelEditing={cancelEditing}
            editModeManager={editModeManager}
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
