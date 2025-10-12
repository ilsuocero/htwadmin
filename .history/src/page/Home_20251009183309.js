import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { auth, db, logout } from "../components/firebase";
import { query, collection, getDocs, where } from "firebase/firestore";
import Map from '../components/map';
import Navbar from '../components/navbar.js';
import AppAuth from '../components/AppAuth';
import RenderPathNetwork from '../components/RenderPathNetwork';
import RenderDestinations from '../components/RenderDestinations';
import RenderCrossRoads from "../components/RenderCrossRoads";
import { useSocket } from '../hooks/useSocket';

function Home() {
    const [connectionState, setConnectionState] = useState({
        tokenIO: ' ',
        roles: [],
        isOnline: false,
    });
    const [user, loading, error] = useAuthState(auth);
    const [name, setName] = useState("");
    const [authenticated, setAuthenticated] = useState(false)
    const [pathNetwork, setPathNetwork] = useState(null);
    const [destNetwork, setDestNetwork] = useState(null);
    const [crossRoads, setCrossRoads] = useState(null);
    const navigate = useNavigate();

    // Use the centralized socket hook - only when authenticated
    console.log('🚀 HtWHome-->[useSocket]: Calling useSocket with authenticated:', authenticated, 'connectionState:', 
      authenticated ? JSON.stringify(connectionState) : 'NULL');
    const {
        socket,
        isConnected,
        isConnecting,
        error: socketError,
        socketOperations
    } = useSocket(authenticated ? connectionState : null);

    // Debug connectionState changes
    useEffect(() => {
        console.log('HtWHome-->[useEffect connectionState]:', JSON.stringify(connectionState));
    }, [connectionState]);

    // Debug authenticated changes
    useEffect(() => {
        console.log('HtWHome-->[useEffect authenticated]:', authenticated);
    }, [authenticated]);


    const fetchUserName = async () => {
        try {
            const q = query(collection(db, "users"), where("uid", "==", user?.uid));
            const doc = await getDocs(q);
            const data = doc.docs[0].data();
            setName(data.name);
        } catch (err) {
            console.error(err);
            alert("An error occured while fetching user data");
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!user) return navigate("/");
        fetchUserName();
        if (error) console.log('Home error: ', error);
    }, [user, loading, error]);

    return (
        <div className="dashboard">
            <AppAuth user={user}
                setConnectionState={setConnectionState}
                setAuthenticated={setAuthenticated} />
            {authenticated &&
                <>
                    <Navbar name={name} email={user?.email} />
                    <RenderPathNetwork connectionState={connectionState} setPathNetwork={setPathNetwork} />
                    <RenderDestinations connectionState={connectionState} setDestNetwork={setDestNetwork} />
                    <RenderCrossRoads connectionState={connectionState} setCrossRoads={setCrossRoads} />
                    <Map
                        pathNetwork={pathNetwork}
                        destNetwork={destNetwork}
                        crossRoads={crossRoads}
                        setCrossRoads={setCrossRoads}
                        setPathNetwork={setPathNetwork}
                        setDestNetwork={setDestNetwork}
                        connectionState={connectionState}
                    />
                </>
            }
            {!authenticated &&
                <>
                    <Navbar name={name} email={user?.email} />

                </>
            }
        </div>
    );
}
export default Home;
