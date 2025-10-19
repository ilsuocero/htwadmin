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
  onEditModeClick,
  onSaveClick,
  onCancelClick,
  onQuitClick,
  canSaveSegment
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
        <Tooltip title="Save Segment (s)">
          <button 
            className={`nav-button ${canSaveSegment ? 'active' : ''}`}
            onClick={onSaveClick}
            type="button"
            disabled={!canSaveSegment}
          >
            <SaveIcon />
            Save
          </button>
        </Tooltip>
        
        <Tooltip title="Cancel Last Point (Delete)">
          <button 
            className="nav-button"
            onClick={onCancelClick}
            type="button"
          >
            <CancelIcon />
            Cancel
          </button>
        </Tooltip>
        
        <Tooltip title="Quit Segment Creation (ESC)">
          <button 
            className="nav-button"
            onClick={onQuitClick}
            type="button"
          >
            <DeleteIcon />
            Quit
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
