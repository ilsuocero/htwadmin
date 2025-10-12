export interface PointGeometry {
  type: 'Point';
  coordinates: [number, number];
}

export interface LineStringGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface CrossRoadProperties {
  Tipo: 'bivio' | 'destinazione' | 'incrocio' | 'POI' | 'POIdest' | 'indicazione';
  GeoFence: number;
  Nome: string;
  IDF: number;
  id: string;
  descriptions: Array<{
    language: string;
    DescBreve: string;
    DescEstesa: string;
  }>;
}

export interface PathProperties {
  id: string;
  Nome?: string;
  // Add other path properties as needed
}

export interface CrossRoadFeature {
  type: 'Feature';
  properties: CrossRoadProperties;
  geometry: PointGeometry;
}

export interface PathFeature {
  type: 'Feature';
  properties: PathProperties;
  geometry: LineStringGeometry;
}

export interface FeatureCollection<T> {
  type: 'FeatureCollection';
  features: T[];
}

export type CrossRoadsCollection = FeatureCollection<CrossRoadFeature>;
export type PathsCollection = FeatureCollection<PathFeature>;

export interface ConnectionState {
  tokenIO: string;
  roles: string[];
  isOnline: boolean;
}

export interface MapCoordinates {
  lng: number;
  lat: number;
}

export interface ShowFormState {
  show: boolean;
  coordinates: MapCoordinates | null;
}

export interface PathFormState {
  show: boolean;
  coordinates: [number, number][] | null;
  snap1: { clickedCoords: [number, number]; featureId: string } | null;
  snap2: { clickedCoords: [number, number]; featureId: string } | null;
