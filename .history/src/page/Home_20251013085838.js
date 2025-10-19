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
        user={user}
        setConnectionState={(connectionState) => 
          dispatch({ type: 'SET_CONNECTION_STATE', payload: connectionState })
        }
        setAuthenticated={(authenticated) => 
          dispatch({ type: 'SET_AUTH_USER', payload: authenticated ? user : null })
        } 
      
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
