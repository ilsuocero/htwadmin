import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAppState } from '../../context/AppStateContext';
import MapView from './MapView';
import CrossRoadForm from '../CrossRoadForm';
import PathForm from '../PathForm';
import { useStateTracker } from '../../hooks/useStateTracker';

export const MapContainer = forwardRef(({
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
}, ref) => {
  const mapRef = useRef(null);
  const { state, dispatch } = useAppState();
  
  // Expose the mapRef to parent component
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current?.getMap(),
    getMapContainer: () => mapRef.current?.getMapContainer(),
    recenter: () => mapRef.current?.recenter()
  }));
  
  // Debug: Check when mapRef becomes available
  useEffect(() => {
    console.log('🗺️ MapContainer: Map ref status', {
      hasMapRef: !!mapRef.current,
      hasMap: mapRef.current?.getMap ? !!mapRef.current.getMap() : false,
      getMapResult: mapRef.current?.getMap ? mapRef.current.getMap() : 'no getMap method'
    });
  }, [mapRef]);
  
  // Track state changes
  useStateTracker('MapContainer', {
    currentMode: state.map.mode,
    showCrossroadForm: state.ui.showCrossroadForm,
    showPathForm: state.ui.showPathForm,
    hasMapRef: !!mapRef.current
  });
  
  // Use enhanced event handlers from editModeManager
  const {
    handleMapClick,
    handleMapMouseDown,
    handleMapMouseMove,
    handleMapMouseUp,
    handleContextMenu
  } = editModeManager;
  
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
        selectedFeature={state.ui.formData?.feature}
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
});
