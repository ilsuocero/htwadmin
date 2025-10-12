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
        console.error('🚀 HtWCrossRoadForm-->[loadPOIDescriptions]: Socket not connected or operations not available');
      }
    } catch (error) {
      console.error('🚀 HtWCrossRoadForm-->[loadPOIDescriptions]: Exception loading descriptions:', error);
    }
  };

  const handleInputChange = (field: keyof FormData) => (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'geoFence' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async () => {
    // Validation for POI fields
    if (isPOI) {
      if (formData.shortDescription.length < 30) {
        alert('Short description must be at least 30 characters long.');
        return;
      }
      if (formData.longDescription.length < 100) {
        alert('Long description must be at least 100 characters long.');
        return;
      }
      if (formData.shortDescriptionIt.length < 30) {
        alert('Italian short description must be at least 30 characters long.');
        return;
      }
      if (formData.longDescriptionIt.length < 100) {
        alert('Italian long description must be at least 100 characters long.');
        return;
      }
    }

    // Check socket connection
    if (!socketOperations || !isConnected) {
      console.error('🚀 HtWCrossRoadForm-->[handleSubmit]: Socket not connected or operations not available');
      alert('Failed to connect to server. Please check your connection.');
      return;
    }

    setLoading(true);
    try {
      // Determine coordinates
      let lng = coordinates.lng;
      let lat = coordinates.lat;
      if (selectedFeature?.current?.geometry?.updateCoords) {
        const featureCoordinates = selectedFeature.current.geometry.updateCoords;
        lng = featureCoordinates[0];
        lat = featureCoordinates[1];
      }

      const newFeature = {
        type: 'Feature',
        properties: {
          Tipo: formData.tipo,
          GeoFence: formData.geoFence,
          Nome: formData.nome,
          IDF: selectedFeature?.current?.properties?.IDF || generateUniqueNumber(),
          id: formData.id,
          descriptions: [
            {
              language: 'en',
              DescBreve: formData.shortDescription,
              DescEstesa: formData.longDescription
            },
            {
              language: 'it',
              DescBreve: formData.shortDescriptionIt,
              DescEstesa: formData.longDescriptionIt
            }
          ]
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      };

      console.log('🚀 HtWCrossRoadForm-->[handleSubmit]: Attempting to save crossroad with data:', JSON.stringify(newFeature));
      
      // Set up listener for crossRoadSaved response
      const cleanupListener = socketOperations.on('crossRoadSaved', (data: any) => {
        // Clear the timeout since we got our response
        clearTimeout(timeoutId);
        
        console.log('🚀 HtWCrossRoadForm-->[crossRoadSaved]: Crossroad saved successfully:', data);
        if (data == null) {
          alert('Feature saved!');
        } else {
          const message = 'Error saving feature: ' + data;
          alert(message);
        }
        
        // Close the form and reset state
        onSubmit(newFeature);
        handleClose();
        
        // Clean up the listener
        if (cleanupListener) cleanupListener();
      });
      
      // Emit the save request
      console.log('🚀 HtWCrossRoadForm-->[handleSubmit]: Emitting saveCrossRoad request');
      socketOperations.emit('saveCrossRoad', newFeature);
      
      // Set timeout to handle cases where response never comes
      const timeoutId = setTimeout(() => {
        // Only fire timeout if cleanupListener still exists (no response received)
        if (cleanupListener) {
          console.error('🚀 HtWCrossRoadForm-->[handleSubmit]: Timeout waiting for crossRoadSaved response');
          alert('Server response timeout. Please check if the crossroad was saved.');
          setLoading(false);
          cleanupListener();
        }
      }, 10000); // 10 second timeout
      
    } catch (error) {
      console.error('🚀 HtWCrossRoadForm-->[handleSubmit]: Exception during save:', error);
      alert('Something went wrong: ' + error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      id: '',
      nome: 'Bivio',
      tipo: 'bivio',
      geoFence: 30,
      shortDescription: '',
      longDescription: '',
      shortDescriptionIt: '',
      longDescriptionIt: ''
    });
    setIsPOI(false);
    onClose();
  };

  const getShortDescriptionHint = (language: 'en' | 'it') => {
    const baseText = language === 'en' 
      ? `You are at ${formData.nome}... (start the short description with "where", where you can eat, where you can see...)`
      : `Sei a ${formData.nome}... (inizia la descrizione breve con "dove", dove si mangia, dove puoi ammirare...)`;
    return baseText;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={isPOI ? "lg" : "sm"} 
      fullWidth
      fullScreen={isPOI}
    >
      <DialogTitle>
        {selectedFeature?.current ? 'Edit Feature' : 'Add New Feature'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
