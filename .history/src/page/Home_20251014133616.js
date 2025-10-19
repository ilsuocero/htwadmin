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
import ContextMenu from '../components/ContextMenu';
import RenderPathNetwork from '../components/RenderPathNetwork';
import RenderDestinations from '../components/RenderDestinations';
import RenderCrossRoads from "../components/RenderCrossRoads";
import { useSocket } from '../hooks/useSocket';
import { useAppState } from '../context/AppStateContext';  // ADD THIS

function Home() {
  const { state, dispatch } = useAppState();
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  
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
          <NavbarContainer name={name} email={user?.email} />
          
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
                  payload: { coordinates: state.ui.contextMenuCoordinates } 
                });
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
