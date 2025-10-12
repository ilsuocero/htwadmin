import axios from 'axios';

export interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    legs: Array<{
      steps: any[];
      weight: number;
      summary: string;
      duration: number;
      distance: number;
    }>;
    weight_name: string;
    geometry: {
      coordinates: number[][];
      type: string;
    };
    weight: number;
    duration: number;
    distance: number;
  }>;
  waypoints: Array<{
    hint: string;
    location: number[];
    name: string;
    distance: number;
  }>;
}

/**
 * Service for interacting with OSRM routing API
 */
export class OSRMService {
  private static readonly BASE_URL = 'http://router.project-osrm.org';
  
  /**
   * Get route between two points using OSRM routing service
   * @param startLngLat Starting coordinates [lng, lat]
   * @param endLngLat Ending coordinates [lng, lat]
   * @param profile Routing profile (default: 'foot')
   * @returns Promise with route coordinates
   */
  static async getRoute(
    startLngLat: [number, number],
    endLngLat: [number, number],
    profile: string = 'foot'
  ): Promise<number[][]> {
    try {
      const [startLng, startLat] = startLngLat;
      const [endLng, endLat] = endLngLat;
      
