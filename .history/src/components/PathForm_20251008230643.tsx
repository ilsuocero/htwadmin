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
import { emitEvent } from './sockets.ts';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { generateUniqueNumber } from './services.ts';
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
  selectedFeature
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

