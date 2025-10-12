import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { emitEvent } from './sockets';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { generateUniqueNumber } from './services';
import { ConnectionState } from '../types/geojson';

interface PathFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (newSegment: any) => void;
  coordinates: number[][];
  connectionState: ConnectionState;
  snap1?: any;
  snap2?: any;
  selectedFeature?: any;
  socketOperations: any;
  isConnected: boolean;
}

interface FormData {
  id: string;
  nome: string;
  tipo: string;
  condizione: string;
  distanza: string;
  v1Angle: string;
  v2Angle: string;
  vertex1: string;
  vertex2: string;
}

const PathForm: React.FC<PathFormProps> = ({
  open,
  onClose,
  onSubmit,
  coordinates,
  connectionState,
  snap1,
  snap2,
  selectedFeature,
  socketOperations,
  isConnected
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    nome: 'pathway',
    tipo: 'sentiero',
    condizione: '.',
    distanza: '',
    v1Angle: '',
    v2Angle: '',
    vertex1: '',
    vertex2: ''
  });

  const [loading, setLoading] = useState(false);

  // Calculate form values when coordinates change
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const newFormData: Partial<FormData> = {
        id: uuidv4()
      };

      // Calculate distance
      const lineString = turf.lineString(coordinates);
      const distance = turf.length(lineString, { units: 'meters' });
      newFormData.distanza = distance.toFixed(0);

      // Calculate angles
      const calculateAngle = (point1: number[], point2: number[]) => {
        const bearing = turf.bearing(turf.point(point1), turf.point(point2));
        return bearing >= 0 ? bearing : bearing + 360;
      };

      // V1 Angle
      if (coordinates.length >= 3) {
        const firstThreeCoordinates = coordinates.slice(0, 3);
        const v1Angle = calculateAngle(firstThreeCoordinates[0], firstThreeCoordinates[2]);
        newFormData.v1Angle = v1Angle.toFixed(2);
      } else if (coordinates.length === 2) {
        const v1Angle = calculateAngle(coordinates[0], coordinates[1]);
        newFormData.v1Angle = v1Angle.toFixed(2);
      } else {
        newFormData.v1Angle = 'N/A';
      }

      // V2 Angle
      if (coordinates.length >= 3) {
        const lastThreeCoordinates = coordinates.slice(-3).reverse();
        const v2Angle = calculateAngle(lastThreeCoordinates[0], lastThreeCoordinates[2]);
        newFormData.v2Angle = v2Angle.toFixed(0);
      } else if (coordinates.length === 2) {
        const v2Angle = calculateAngle(coordinates[1], coordinates[0]);
        newFormData.v2Angle = v2Angle.toFixed(0);
      } else {
        newFormData.v2Angle = 'N/A';
      }

      // Vertex coordinates
      const firstCoordinate = coordinates[0];
      const lastCoordinate = coordinates[coordinates.length - 1];
      newFormData.vertex1 = JSON.stringify(firstCoordinate);
      newFormData.vertex2 = JSON.stringify(lastCoordinate);

      setFormData(prev => ({ ...prev, ...newFormData }));
    }
  }, [coordinates]);

  const handleInputChange = (field: keyof FormData) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value as string
    }));
  };

  const handleSubmit = async () => {
    // Check socket connection
    if (!socketOperations || !isConnected) {
      console.error('🚀 HtWPathForm-->[handleSubmit]: Socket not connected or operations not available');
      alert('Failed to connect to server. Please check your connection.');
      return;
    }

    setLoading(true);
    try {
      const newSegment = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
        properties: {
          id: formData.id,
          ID: generateUniqueNumber(),
          Nome: formData.nome,
          Tipo: formData.tipo,
          Condizione: formData.condizione,
          Distanza: parseInt(formData.distanza),
          V1Angle: parseInt(formData.v1Angle) || 0,
          V2Angle: parseInt(formData.v2Angle) || 0,
          v1: snap1?.featureId,
          v2: snap2?.featureId,
        },
      };

      console.log('🚀 HtWPathForm-->[handleSubmit]: Attempting to save segment with data:', JSON.stringify(newSegment));
      
      // Set up listener for segmentSaved response
      const cleanupListener = socketOperations.on('segmentSaved', (data: any) => {
        console.log('🚀 HtWPathForm-->[segmentSaved]: Segment saved successfully:', data);
        
        // Close the form and reset state
        onSubmit(newSegment);
        handleClose();
        
        // Clean up the listener
        if (cleanupListener) cleanupListener();
      });
      
      // Emit the save request
      console.log('🚀 HtWPathForm-->[handleSubmit]: Emitting saveSegment request');
      socketOperations.emit('saveSegment', newSegment);
      
      // Set timeout to handle cases where response never comes
      const timeoutId = setTimeout(() => {
        console.error('🚀 HtWPathForm-->[handleSubmit]: Timeout waiting for segmentSaved response');
        alert('Server response timeout. Please check if the segment was saved.');
        setLoading(false);
        if (cleanupListener) cleanupListener();
      }, 10000); // 10 second timeout
      
      // Return cleanup function for timeout
      return () => {
        clearTimeout(timeoutId);
      };
      
    } catch (error) {
      vertex2: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Path Segment</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ID"
            value={formData.id}
            InputProps={{ readOnly: true }}
            fullWidth
            size="small"
          />

          <TextField
            label="Nome"
            value={formData.nome}
            onChange={handleInputChange('nome')}
            required
            fullWidth
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={formData.tipo}
              label="Tipo"
              onChange={handleInputChange('tipo')}
            >
              <MenuItem value="sentiero">sentiero</MenuItem>
              <MenuItem value="strada">strada</MenuItem>
              <MenuItem value="campo">campo</MenuItem>
              <MenuItem value="tratturo">tratturo</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Condizione</InputLabel>
            <Select
              value={formData.condizione}
              label="Condizione"
              onChange={handleInputChange('condizione')}
            >
              <MenuItem value=".">.</MenuItem>
              <MenuItem value="sterrata">sterrata</MenuItem>
              <MenuItem value="asfaltata">asfaltata</MenuItem>
              <MenuItem value="provinciale">provinciale</MenuItem>
              <MenuItem value="statale">statale</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Distanza (meters)"
            value={formData.distanza}
            InputProps={{ readOnly: true }}
            fullWidth
            size="small"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="V1 Angle"
              value={formData.v1Angle}
              InputProps={{ readOnly: true }}
              fullWidth
              size="small"
            />
            <TextField
              label="V2 Angle"
              value={formData.v2Angle}
              InputProps={{ readOnly: true }}
              fullWidth
              size="small"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Vertex 1"
              value={formData.vertex1}
              InputProps={{ readOnly: true }}
              fullWidth
              size="small"
              multiline
              maxRows={2}
            />
            <TextField
              label="Vertex 2"
              value={formData.vertex2}
              InputProps={{ readOnly: true }}
              fullWidth
              size="small"
              multiline
              maxRows={2}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Segment created with {coordinates.length} coordinate points
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formData.nome}
        >
          {loading ? 'Saving...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PathForm;
