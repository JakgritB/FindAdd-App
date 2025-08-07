declare global {
    interface Window {
      longdo: {
        Map: (config: {
          placeholder: HTMLElement;
          lastView?: boolean;
          zoom?: number;
          location?: { lon: number; lat: number };
        }) => LongdoMapInstance;
        Marker: new (
          location: { lon: number; lat: number },
          options?: Record<string, unknown>
        ) => LongdoMarker;
        Polyline: new (
          points: Array<{ lon: number; lat: number }>,
          options?: Record<string, unknown>
        ) => LongdoPolyline;
        Layers: {
          NORMAL: string;
          GRAY: string;
          TRAFFIC: string;
        };
        LineStyle: {
          Solid: string;
          Dashed: string;
        };
      };
    }
  }
  
  interface LongdoMapInstance {
    Overlays: {
      add: (overlay: LongdoMarker | LongdoPolyline) => void;
      remove: (overlay: LongdoMarker | LongdoPolyline) => void;
    };
    Layers: {
      setBase: (layer: string) => void;
      add: (layer: string) => void;
      remove: (layer: string) => void;
      contains: (layer: string) => boolean;
    };
    location: (location?: { lon: number; lat: number }, animate?: boolean) => void;
    zoom: (level?: number) => number;
    bound: (bounds: {
      minLon: number;
      maxLon: number;
      minLat: number;
      maxLat: number;
    }) => void;
  }
  
  interface LongdoMarker {}
  interface LongdoPolyline {}
  
  export {};