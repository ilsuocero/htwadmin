function saveSegment() {
    if (!snap2.current) {
        alert('A segment must start/end from a crossroad or a destination!');
        return;
    }

    // Get the coordinates of the segment and add it to the sentieri feature collection
    const tempLineSource = map.current.getSource('tempLineSource');
    const tempLineData = tempLineSource._data;

    if (tempLineData.geometry && tempLineData.geometry.coordinates.length > 0) {
        const segmentCoordinates = tempLineData.geometry.coordinates;

        // Create the segment form
        const segmentForm = document.createElement('div');
        segmentForm.className = 'custom-form'; // Add a CSS class for styling

        // Set CSS styles for the form
        segmentForm.style.background = 'white';
        segmentForm.style.padding = '8px 20px'; // Add padding to the right
        segmentForm.style.borderRadius = '4px';
        segmentForm.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        segmentForm.style.fontFamily = 'Arial, sans-serif';
        segmentForm.style.fontSize = '14px';

        // Create form elements

        // Create form elements
        const idLabel = document.createElement('label');
        idLabel.textContent = 'ID:';
        idLabel.style.display = 'block';
        idLabel.style.marginBottom = '4px';

        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.name = 'ID';
        idInput.value = uuidv4(); // Set the initial value as the generated UUID
        idInput.readOnly = true; // Make the input field read-only
        idInput.style.width = '100%';
        idInput.style.marginLeft = '4px';

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Nome:';
        nameLabel.style.display = 'block';
        nameLabel.style.marginBottom = '4px';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.name = 'Nome';
        nameInput.required = true;
        nameInput.style.width = '100%';
        nameInput.style.marginLeft = '4px';

        const tipoLabel = document.createElement('label');
        tipoLabel.textContent = 'Tipo:';
        tipoLabel.style.display = 'block';
        tipoLabel.style.marginBottom = '4px';

        const tipoInput = document.createElement('select');
        tipoInput.name = 'Tipo';
        tipoInput.style.width = '100%';
        tipoInput.style.marginLeft = '4px';

        // Create dropdown options
        const tipoOptions = ['Option 1', 'Option 2', 'Option 3'];
        tipoOptions.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue;
            tipoInput.appendChild(option);
        });

        const condizioneLabel = document.createElement('label');
        condizioneLabel.textContent = 'Condizione:';
        condizioneLabel.style.display = 'block';
        condizioneLabel.style.marginBottom = '4px';

        const condizioneInput = document.createElement('input');
        condizioneInput.type = 'text';
        condizioneInput.name = 'Condizione';
        condizioneInput.style.width = '100%';
        condizioneInput.style.marginLeft = '4px';

        const distanzaLabel = document.createElement('label');
        distanzaLabel.textContent = 'Distanza:';
        distanzaLabel.style.display = 'block';
        distanzaLabel.style.marginBottom = '4px';

        const distanzaInput = document.createElement('input');
        distanzaInput.type = 'text';
        distanzaInput.name = 'Distanza';
        distanzaInput.style.width = '100%';
        distanzaInput.style.marginLeft = '4px';

        const v1AngleLabel = document.createElement('label');
        v1AngleLabel.textContent = 'V1 Angle:';
        v1AngleLabel.style.display = 'block';
        v1AngleLabel.style.marginBottom = '4px';

        const v1AngleInput = document.createElement('input');
        v1AngleInput.type = 'text';
        v1AngleInput.name = 'V1 Angle';
        v1AngleInput.style.width = '100%';
        v1AngleInput.style.marginLeft = '4px';

        const v2AngleLabel = document.createElement('label');
        v2AngleLabel.textContent = 'V2 Angle:';
        v2AngleLabel.style.display = 'block';
        v2AngleLabel.style.marginBottom = '4px';

        const v2AngleInput = document.createElement('input');
        v2AngleInput.type = 'text';
        v2AngleInput.name = 'V2 Angle';
        v2AngleInput.style.width = '100%';
        v2AngleInput.style.marginLeft = '4px';

        const vertex1Label = document.createElement('label');
        vertex1Label.textContent = 'Vertex 1:';
        vertex1Label.style.display = 'block';
        vertex1Label.style.marginBottom = '4px';

        const vertex1Input = document.createElement('input');
        vertex1Input.type = 'text';
        vertex1Input.name = 'Vertex 1';
        vertex1Input.style.width = '100%';
        vertex1Input.style.marginLeft = '4px';

        const vertex2Label = document.createElement('label');
        vertex2Label.textContent = 'Vertex 2:';
        vertex2Label.style.display = 'block';
        vertex2Label.style.marginBottom = '4px';

        const vertex2Input = document.createElement('input');
        vertex2Input.type = 'text';
        vertex2Input.name = 'Vertex 2';
        vertex2Input.style.width = '100%';
        vertex2Input.style.marginLeft = '4px';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '8px';

        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.style.marginLeft = '8px';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';

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
                    coordinates: segmentCoordinates,
                },
                properties: {
                    ID: id,
                    Nome: nome,
                    Tipo: tipo,
                    Condizione: condizione,
                    Distanza: distanza,
                    'V1 Angle': v1Angle,
                    'V2 Angle': v2Angle,
                    'Vertex 1': vertex1,
                    'Vertex 2': vertex2,
                },
            };

            // Add the new segment to the sentieri feature collection
            sentieriData.features.push(newSegment);
            sentieriSource.setData(sentieriData);

            // Remove the form from the map
            map.current.getContainer().removeChild(segmentForm);

            // Step 4: Remove the temporary line and point layers
            map.current.removeLayer('tempLineLayer');
            map.current.removeLayer('tempPointLayer');
            map.current.removeSource('tempLineSource');
            map.current.removeSource('tempPointSource');

            // Step 5: Disable edit mode
            editMode.current = false;
            setEditMODE(false);
            map.current.getCanvas().style.cursor = '';
        });

        // Handle form cancellation
        cancelButton.addEventListener('click', () => {
            // Remove the form from the map
            map.current.getContainer().removeChild(segmentForm);

            // Step 4: Remove the temporary line and point layers
            map.current.removeLayer('tempLineLayer');
            map.current.removeLayer('tempPointLayer');
            map.current.removeSource('tempLineSource');
            map.current.removeSource('tempPointSource');

            // Step 5: Disable edit mode
            editMode.current = false;
            setEditMODE(false);
            map.current.getCanvas().style.cursor = '';
        });

        // Append the form elements to the segment form
        segmentForm.appendChild(idLabel);
        segmentForm.appendChild(idInput);
        segmentForm.appendChild(nameLabel);
        segmentForm.appendChild(nameInput);
        segmentForm.appendChild(tipoLabel);
        segmentForm.appendChild(tipoInput);
        segmentForm.appendChild(condizioneLabel);
        segmentForm.appendChild(condizioneInput);
        segmentForm.appendChild(distanzaLabel);
        segmentForm.appendChild(distanzaInput);
        segmentForm.appendChild(v1AngleLabel);
        segmentForm.appendChild(v1AngleInput);
        segmentForm.appendChild(v2AngleLabel);
        segmentForm.appendChild(v2AngleInput);
        segmentForm.appendChild(vertex1Label);
        segmentForm.appendChild(vertex1Input);
        segmentForm.appendChild(vertex2Label);
        segmentForm.appendChild(vertex2Input);
        buttonContainer.appendChild(submitButton);
        buttonContainer.appendChild(cancelButton);
        segmentForm.appendChild(buttonContainer);

        // Add the form to the map container
        map.current.getContainer().appendChild(segmentForm);
    }
}
