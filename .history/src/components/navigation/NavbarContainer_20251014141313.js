import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useSegmentManager } from '../../hooks/useSegmentManager';
import { Navbar } from './Navbar';

export const NavbarContainer = ({ name, email }) => {
  const { state, dispatch } = useAppState();
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
    />
  );
};
