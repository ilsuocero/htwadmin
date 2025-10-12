import React from 'react';
import { logout } from "./firebase";
import './navbar.css';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import GestureIcon from '@mui/icons-material/Gesture';
import RouteIcon from '@mui/icons-material/Route';
import Tooltip from '@mui/material/Tooltip';

export default function Navbar({ name, email, onAutoSegmentClick, autoSegmentMode }) {
    console.log('🚀 Navbar-->[render]: Props received - onAutoSegmentClick:', typeof onAutoSegmentClick, 'autoSegmentMode:', autoSegmentMode);
    
    const handleAutoSegmentClick = (e) => {
        console.log('🚀 Navbar-->[handleAutoSegmentClick]: Button clicked, calling onAutoSegmentClick');
        if (onAutoSegmentClick) {
            onAutoSegmentClick();
        } else {
            console.error('🚀 Navbar-->[handleAutoSegmentClick]: onAutoSegmentClick is undefined!');
        }
    };

    return (
        <div className="heading">
            <div className="title">
                <h2>Hike the World - Admin</h2>
            </div>
            <div className="icon-buttons">
                {/* Add your icon buttons here */}
                <Tooltip title="Save changes to the current path or feature" arrow>
                    <button className="icon-button">
                        <SaveIcon />
                    </button>
                </Tooltip>
                <Tooltip title="Cancel current operation or discard changes" arrow>
                    <button className="icon-button">
                        <CancelIcon />
                    </button>
                </Tooltip>
                <Tooltip title="Delete selected path, crossroad, or destination" arrow>
                    <button className="icon-button">
                        <DeleteIcon />
                    </button>
                </Tooltip>
                <Tooltip title="Add new path, crossroad, or destination" arrow>
                    <button className="icon-button">
                        <AddIcon />
                    </button>
                </Tooltip>
                <Tooltip title="Toggle map view or show/hide map layers" arrow>
                    <button className="icon-button">
                        <MapIcon />
                    </button>
                </Tooltip>
                <Tooltip title="Draw or edit paths manually on the map" arrow>
                    <button className="icon-button">
                        <GestureIcon />
                    </button>
                </Tooltip>
                <Tooltip title="Auto-create segment between crossroads using OSRM routing" arrow>
                    <button 
                        className={`icon-button ${autoSegmentMode ? 'active' : ''}`} 
                        onClick={handleAutoSegmentClick}
                    >
                        <RouteIcon />
                    </button>
                </Tooltip>
            </div>
            <div className="dashboard__container">
                <div>&nbsp;Logged in as:&nbsp;</div>
                <div>{name}</div>
                {/* <div>{email}</div> */}
                <div>&nbsp;</div>
                <button className="dashboard__btn" onClick={logout}>
                    Logout
                </button>
            </div>
        </div>
    );
