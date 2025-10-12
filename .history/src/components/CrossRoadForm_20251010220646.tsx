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
import { v4 as uuidv4 } from 'uuid';
import { generateUniqueNumber } from './services';
import { ConnectionState } from '../types/geojson';

interface CrossRoadFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (newFeature: any) => void;
  coordinates: { lng: number; lat: number };
  connectionState: ConnectionState;
  selectedFeature?: any;
  socketOperations: any;
  isConnected: boolean;
}

interface FormData {
  id: string;
  nome: string;
  tipo: string;
  geoFence: number;
  shortDescription: string;
  longDescription: string;
  shortDescriptionIt: string;
  longDescriptionIt: string;
}

const CrossRoadForm: React.FC<CrossRoadFormProps> = ({
  open,
  onClose,
  onSubmit,
  coordinates,
  connectionState,
  selectedFeature,
  socketOperations,
  isConnected
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    nome: 'Bivio',
    tipo: 'bivio',
    geoFence: 30,
    shortDescription: '',
    longDescription: '',
    shortDescriptionIt: '',
    longDescriptionIt: ''
  });

  const [loading, setLoading] = useState(false);
  const [isPOI, setIsPOI] = useState(false);

  // Initialize form data when component opens
  useEffect(() => {
    if (open) {
      const initialData: Partial<FormData> = {
        id: selectedFeature?.current?.properties?.id || uuidv4(),
        nome: selectedFeature?.current?.properties?.Nome || 'Bivio',
        tipo: selectedFeature?.current?.properties?.Tipo || 'bivio',
        geoFence: selectedFeature?.current?.properties?.GeoFence || 30
      };

      // Set descriptions if available
      const descriptions = selectedFeature?.current?.properties?.descriptions;
      if (descriptions) {
        const enDesc = descriptions.find((d: any) => d.language === 'en');
        const itDesc = descriptions.find((d: any) => d.language === 'it');
        if (enDesc) {
          initialData.shortDescription = enDesc.DescBreve || '';
          initialData.longDescription = enDesc.DescEstesa || '';
        }
        if (itDesc) {
          initialData.shortDescriptionIt = itDesc.DescBreve || '';
          initialData.longDescriptionIt = itDesc.DescEstesa || '';
        }
      }

      setFormData(prev => ({ ...prev, ...initialData }));
      setIsPOI(['POI', 'POIdest'].includes(initialData.tipo || ''));
    }
  }, [open, selectedFeature]);

  // Handle type change to show/hide POI fields
  useEffect(() => {
    setIsPOI(['POI', 'POIdest'].includes(formData.tipo));
    
    // Load descriptions if it's a POI and we have an ID
    if (['POI', 'POIdest'].includes(formData.tipo) && formData.id && connectionState) {
      loadPOIDescriptions(formData.id);
    }
  }, [formData.tipo, formData.id, connectionState]);

  const loadPOIDescriptions = async (id: string) => {
    try {
      if (socketOperations && isConnected) {
        console.log('🚀 HtWCrossRoadForm-->[loadPOIDescriptions]: Loading POI descriptions for ID:', id);
        
        socketOperations.emitWithCallback('getPOI2LangDescr', { id, primaryLang: 'en', secondaryLang: 'it' }, (err: any, descriptions: any) => {
          if (err) {
            console.error('🚀 HtWCrossRoadForm-->[loadPOIDescriptions]: Error loading POI descriptions:', err);
            return;
          }
          console.log('🚀 HtWCrossRoadForm-->[loadPOIDescriptions]: POI descriptions received:', descriptions);
          setFormData(prev => ({
            ...prev,
            shortDescription: descriptions.primary.short || '',
            longDescription: descriptions.primary.long || '',
            shortDescriptionIt: descriptions.secondary.short || '',
            longDescriptionIt: descriptions.secondary.long || ''
          }));
        });
      } else {
