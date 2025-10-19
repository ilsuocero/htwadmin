import React, { useRef, useEffect } from 'react';
import { useAppState } from '../../context/AppStateContext';
import MapView from './MapView';
import { useSimpleMapBehavior } from '../../hooks/useSimpleMapBehavior';
import CrossRoadForm from '../CrossRoadForm';
import PathForm from '../PathForm';
import { useStateTracker } from '../../hooks/useStateTracker';

export const MapContainer = ({
  pathNetwork,
  destNetwork,
  crossRoads,
  setCrossRoads,
  setPathNetwork,
  setDestNetwork,
  connectionState,
  socketOperations,
  isConnected,
  cancelEditing, // Receive cancelEditing from parent
  editModeManager // Receive edit mode manager from parent
}) => {
  const mapRef = useRef(null);
  const { state, dispatch } = useAppState();
  
  // Pass the map instance to the father state when it becomes available
  useEffect(() => {
    const checkAndSetMap = () => {
      if (mapRef.current?.getMap() && editModeManager?.setMapInstance) {
        console.log('🎯🎯🎯🎯🎯 MapContainer: Setting map instance in father state');
        editModeManager.setMapInstance(mapRef.current.getMap());
      } else {
        // If map not available yet, check again in 100ms
        setTimeout(checkAndSetMap, 100);
      }
    };
    
    checkAndSetMap();
  }, [editModeManager]);
  
  // Track state changes
  useStateTracker('MapContainer', {
    currentMode: state.map.mode,
    showCrossroadForm: state.ui.showCrossroadForm,
    showPathForm: state.ui.showPathForm,
    hasMapRef: !!mapRef.current
  });
  
  // Use the simplified behavior hook with publicCurrentMode
  const {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  } = useSimpleMapBehavior(mapRef, editModeManager);
  
  return (
    <>
      <MapView
        ref={mapRef}
        pathNetwork={pathNetwork}
        destNetwork={destNetwork}
        crossRoads={crossRoads}
        onMapClick={handleMapClick}
        onMapMouseDown={handleMapMouseDown}
        onMapMouseMove={handleMapMouseMove}
        onMapMouseUp={handleMapMouseUp}
        onContextMenu={handleContextMenu}
        currentMode={state.map.mode}
        editModeManager={editModeManager}
      />
      
      <CrossRoadForm
        open={state.ui.showCrossroadForm}
        onClose={() => dispatch({ type: 'HIDE_CROSSROAD_FORM' })}
        coordinates={state.ui.formData?.coordinates || { lng: 0, lat: 0 }}
        connectionState={connectionState}
        socketOperations={socketOperations}
        isConnected={isConnected}
        onSubmit={() => {}}
      />
      
      <PathForm
        open={state.ui.showPathForm}
        onClose={() => dispatch({ type: 'HIDE_PATH_FORM' })}
        coordinates={state.ui.formData?.coordinates || []}
        snap1={state.ui.formData?.snap1}
        snap2={state.ui.formData?.snap2}
        connectionState={connectionState}
        socketOperations={socketOperations}
        isConnected={isConnected}
        onSubmit={() => {}}
      />
    </>
  );
};
