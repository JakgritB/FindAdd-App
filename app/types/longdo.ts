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
  time?: number; // เวลาจริงจาก API (วินาที)
  estimatedTime?: number; // เวลาประมาณ (นาที)
  path?: any[]; // พิกัดเส้นทาง
  guide?: any[]; // คำแนะนำการเดินทาง
}

export interface RouteResponse {
  success: boolean;
  route: LongdoPlace[];
  segments: RouteSegment[];
  totalDistance: string;
  totalTime: number;
  paths?: any[]; // พิกัดเส้นทางทั้งหมด
  hasNavigation: boolean; // บอกว่ามีข้อมูลนำทางจริงหรือไม่
  routeGeometry?: any;
}