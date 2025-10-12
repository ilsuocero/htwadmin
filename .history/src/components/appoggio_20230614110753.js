export const usePathsForm = (editMode, setEditMODE,
    pathForm,
    setPathForm,
    setPathNetwork,
    map,
    mapContainer,
    snap1,
    snap2,
    connectionState) => {
    useEffect(() => {


        // Handle form submission
        submitButton.addEventListener('click', (e) => {
            e.preventDefault();

            // Get the entered values
            const id = idInput.value;
            const nome = nameInput.value;
            const tipo = tipoInput.value;
            const condizione = condizioneInput.value;
            const distanza = distanzaInput.value;
            const v1Angle = v1AngleInput.value;
            const v2Angle = v2AngleInput.value;
            const vertex1 = vertex1Input.value;
            const vertex2 = vertex2Input.value;

            // Create a new feature object with the entered properties
            const newSegment = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: pathForm.coordinates,
                },
                properties: {
                    id: id,
                    ID: generateUniqueNumber(),
                    Nome: nome,
                    Tipo: tipo,
                    Condizione: condizione,
                    Distanza: distanza,
                    'V1 Angle': v1Angle,
                    'V2 Angle': v2Angle,
                    v1: snap1.current.featureId,
                    v2: snap2.current.featureId,
                },
            };

    }, [pathForm.show, pathForm.coordinates]);
}