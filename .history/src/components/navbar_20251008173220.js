import React from 'react';
import { logout } from "./firebase";
import './navbar.css';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import GestureIcon from '@mui/icons-material/Gesture';

export default function Navbar({ name, email }) {
    return (
        <div className="heading">
            <div className="title">
                <h2>Hike the World - Admin</h2>
            </div>
            <div className="icon-buttons">
                {/* Add your icon buttons here */}
                <button className="icon-button">
                    <SaveIcon />
                </button>
                <button className="icon-button">
                    <CancelIcon />
                </button>
                <button className="icon-button">
                    <DeleteIcon />
                </button>
                <button className="icon-button">
                    <AddIcon />
                </button>
                <button className="icon-button">
                    <MapIcon />
                </button>
                <button className="icon-button">
                    <GestureIcon />
                </button>
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
}
