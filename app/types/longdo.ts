export interface LongdoSearchResult {
  w: string;
  d: string;
  lat?: number;
  lon?: number;
}

export interface LongdoPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export interface SearchResponse {
  data: LongdoSearchResult[];
  meta: {
    keyword: string;
  };
}

export interface RouteSegment {
  from: LongdoPlace;
  to: LongdoPlace;
  distance: string;
  time?: number;
  estimatedTime?: number;
  path?: Array<{lon: number, lat: number}>;  // แก้จาก any[]
  guide?: Array<{text: string}>;  // แก้จาก any[]
}

export interface RouteResponse {
  success: boolean;
  route: LongdoPlace[];
  segments: RouteSegment[];
  totalDistance: string;
  totalTime: number;
  paths?: Array<{lon: number, lat: number}>;  // แก้จาก any[]
  hasNavigation: boolean;
  routeGeometry?: Record<string, unknown>;  // แก้จาก any
}