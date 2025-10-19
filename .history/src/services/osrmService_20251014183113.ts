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
private static readonly BASE_URL = 'https://routing.openstreetmap.de';
  //private static readonly BASE_URL = 'http://router.project-osrm.org';
  
  /**
   * Get route between two points using OSRM routing service
   * @param startLngLat Starting coordinates [lng, lat]
   * @param endLngLat Ending coordinates [lng, lat]
   *   @param profile Routing profile (default: 'foot')
   * @returns Promise with route coordinates
   */
  static async getRoute(
    startLngLat: [number, number],
    endLngLat: [number, number],
    profile: string = 'driving'
  ): Promise<number[][]> {
    try {
      const [startLng, startLat] = startLngLat;
      const [endLng, endLat] = endLngLat;
      
      //const url = `${this.BASE_URL}/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}`;
      const url = `${this.BASE_URL}/routed-foot/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}`;
      const params = {
        overview: 'full',
        geometries: 'geojson'
      };
      
      console.log('🚀 OSRMService-->[getRoute]: Making request to:', url);
      
      const response = await axios.get<OSRMRouteResponse>(url, { params });
      
      if (response.data.code !== 'Ok') {
        throw new Error(`OSRM routing failed: ${response.data.code}`);
      }
      
      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No routes found between the selected points');
      }
      
      const route = response.data.routes[0];
      const coordinates = route.geometry.coordinates;
      
      console.log('🚀 OSRMService-->[getRoute]: Route found with', coordinates.length, 'points');
      console.log('🚀 OSRMService-->[getRoute]: Distance:', route.distance, 'meters');
      
      return coordinates;
    } catch (error) {
      console.error('🚀 OSRMService-->[getRoute]: Error getting route:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Invalid coordinates or no route found between the selected points');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else {
          throw new Error(`Routing service error: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to get route: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Calculate distance between two points in meters
   * @param startLngLat Starting coordinates [lng, lat]
   * @param endLngLat Ending coordinates [lng, lat]
   * @returns Distance in meters
   */
  static calculateDistance(startLngLat: [number, number], endLngLat: [number, number]): number {
    const [startLng, startLat] = startLngLat;
    const [endLng, endLat] = endLngLat;
    
    // Simple haversine distance calculation
    const R = 6371000; // Earth's radius in meters
    const dLat = (endLat - startLat) * Math.PI / 180;
    const dLng = (endLng - startLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
