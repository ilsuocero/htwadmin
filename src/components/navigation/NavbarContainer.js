import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useSegmentManager } from '../../hooks/useSegmentManager';
import { Navbar } from './Navbar';

export const NavbarContainer = ({ name, email, cancelEditing }) => {
  const { state, dispatch } = useAppState();
  const { saveSegment, cancelSegment, quitSegment, canSaveSegment } = useSegmentManager();
  
  const handleQuitSegment = () => {
    const confirmed = window.confirm('Are you sure you want to quit segment creation? All unsaved changes will be lost.');
    if (confirmed) {
      // Call cancelEditing to clean up temporary features
      if (cancelEditing) {
        cancelEditing();
      } else {
        // Fallback: just exit edit mode
        dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
      }
    }
  };
  
  const handleAutoSegmentClick = () => {
    console.log('NavbarContainer: Auto segment clicked');
    
    if (state.map.mode === 'AUTO_SEGMENT') {
      dispatch({ type: 'STOP_AUTO_SEGMENT' });
    } else {
      dispatch({ type: 'START_AUTO_SEGMENT' });
    }
  };
  
  const handleEditModeClick = () => {
    console.log('NavbarContainer: Edit mode clicked');
    
    if (state.map.mode === 'EDIT') {
      dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });
    } else {
      dispatch({ type: 'SET_MAP_MODE', payload: 'EDIT' });
    }
  };
  
  return (
    <Navbar
      name={name}
      email={email}
      currentMode={state.map.mode}
      isAutoSegmentActive={state.autoSegment.isActive}
      isEditModeActive={state.editMode.isActive}
      onAutoSegmentClick={handleAutoSegmentClick}
      onEditModeClick={handleEditModeClick}
      onSaveClick={saveSegment}
      onCancelClick={cancelSegment}
      onQuitClick={handleQuitSegment}
      canSaveSegment={canSaveSegment}
    />
  );
};
