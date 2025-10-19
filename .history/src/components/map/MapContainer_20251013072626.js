import React, { useRef } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { MapView } from './MapView';
import { useMapBehavior } from '../../hooks/useMapBehavior';
import CrossRoadForm from '../CrossRoadForm';
import PathForm from '../PathForm';

export const MapContainer = ({
  pathNetwork,
  destNetwork,
  crossRoads,
  setCrossRoads,
  setPathNetwork,
  setDestNetwork,
  connectionState,
  socketOperations,
  isConnected
}) => {
  const mapRef = useRef(null);
  const { state, dispatch } = useAppState();
  
  // Custom hook to manage all map behavior based on current mode
  const {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  } = useMapBehavior(mapRef, state.map.mode);
  
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
        formData={state.ui.formData}
        connectionState={connectionState}
        socketOperations={socketOperations}
        isConnected={isConnected}
      />
    </>
  );
};
