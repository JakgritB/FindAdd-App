'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { LongdoPlace, RouteResponse } from '../types/longdo';

interface LongdoMapProps {
  places: LongdoPlace[];
  selectedPlace: LongdoPlace | null;
  route: RouteResponse | null;
  userPosition?: { lat: number; lon: number } | null;
}

export default function LongdoMap({ places, selectedPlace, route, userPosition }: LongdoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LongdoMapInstance | null>(null);
  const markersRef = useRef<LongdoMarker[]>([]);
  const routeLinesRef = useRef<LongdoPolyline[]>([]);
  const userMarkerRef = useRef<LongdoMarker | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);

  useEffect(() => {
    fetch('/api/map-config')
      .then(res => res.json())
      .then(data => setApiKey(data.apiKey))
      .catch(err => console.error('Failed to load map config:', err));
  }, []);

  const clearRoutes = useCallback(() => {
    if (!mapInstance.current || !window.longdo) return;
    
    routeLinesRef.current.forEach(line => {
      mapInstance.current?.Overlays.remove(line);
    });
    routeLinesRef.current = [];
  }, []);

  const drawStraightRoute = useCallback(() => {
    if (!mapInstance.current || !window.longdo || !route) return;
    
    const lineCoordinates = route.route.map(place => ({
      lon: place.lon,
      lat: place.lat
    }));

    const line = new window.longdo.Polyline(lineCoordinates, {
      lineWidth: 4,
      lineColor: 'rgba(59, 130, 246, 0.6)',
      lineStyle: window.longdo.LineStyle.Dashed
    });

    mapInstance.current.Overlays.add(line);
    routeLinesRef.current.push(line);
  }, [route]);

  const drawNavigationRoute = useCallback(async () => {
    if (!mapInstance.current || !window.longdo || !route || !route.hasNavigation) return;
    
    setIsDrawingRoute(true);
    clearRoutes();

    try {
      if (route.paths && route.paths.length > 0) {
        const pathCoordinates = route.paths.map((point: {lon?: number, lat?: number} | number[]) => ({
          lon: (point as {lon?: number})?.lon || (point as number[])[0],
          lat: (point as {lat?: number})?.lat || (point as number[])[1]
        }));

        const navigationLine = new window.longdo.Polyline(pathCoordinates, {
          lineWidth: 5,
          lineColor: 'rgba(59, 130, 246, 1)',
          lineStyle: window.longdo.LineStyle.Solid
        });

        mapInstance.current.Overlays.add(navigationLine);
        routeLinesRef.current.push(navigationLine);
      } else {
        drawStraightRoute();
      }
    } catch (error) {
      console.error('Error drawing navigation route:', error);
      drawStraightRoute();
    } finally {
      setIsDrawingRoute(false);
    }
  }, [route, clearRoutes, drawStraightRoute]);

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current || !window.longdo) return;

    markersRef.current.forEach(marker => {
      mapInstance.current?.Overlays.remove(marker);
    });
    markersRef.current = [];

    const displayPlaces = route ? route.route : places;

    displayPlaces.forEach((place, index) => {
      const isStart = route && index === 0;
      const isEnd = route && index === displayPlaces.length - 1;
      
      let markerColor = '#3B82F6';
      let markerIcon = (index + 1).toString();
      
      if (isStart) {
        markerColor = '#10B981';
        markerIcon = '🚚';
      } else if (isEnd) {
        markerColor = '#EF4444';
        markerIcon = '🏁';
      } else if (route) {
        markerIcon = index.toString();
      }

      const marker = new window.longdo.Marker(
        { lon: place.lon, lat: place.lat },
        {
          title: `${isStart ? '🚚 เริ่มต้น: ' : isEnd ? '🏁 สิ้นสุด: ' : `📦 ${index}. `}${place.name}`,
          detail: place.address,
          visibleRange: { min: 0, max: 20 },
          icon: {
            html: `
              <div style="
                background: ${markerColor}; 
                color: white; 
                width: ${isStart || isEnd ? '36px' : '30px'}; 
                height: ${isStart || isEnd ? '36px' : '30px'}; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: bold; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                font-size: ${isStart || isEnd ? '16px' : '14px'};
                border: 2px solid white;
              ">
                ${markerIcon}
              </div>`,
            offset: { x: 18, y: 18 }
          }
        }
      );
      
      mapInstance.current?.Overlays.add(marker);
      markersRef.current.push(marker);
    });

    if (displayPlaces.length > 0) {
      setTimeout(() => {
        if (!mapInstance.current) return;
        
        if (displayPlaces.length === 1) {
          mapInstance.current.location({ lon: displayPlaces[0].lon, lat: displayPlaces[0].lat });
          mapInstance.current.zoom(16);
        } else {
          const bounds = displayPlaces.reduce((acc, place) => {
            return {
              minLon: Math.min(acc.minLon, place.lon),
              maxLon: Math.max(acc.maxLon, place.lon),
              minLat: Math.min(acc.minLat, place.lat),
              maxLat: Math.max(acc.maxLat, place.lat)
            };
          }, {
            minLon: displayPlaces[0].lon,
            maxLon: displayPlaces[0].lon,
            minLat: displayPlaces[0].lat,
            maxLat: displayPlaces[0].lat
          });

          mapInstance.current.bound({
            minLon: bounds.minLon - 0.005,
            maxLon: bounds.maxLon + 0.005,
            minLat: bounds.minLat - 0.005,
            maxLat: bounds.maxLat + 0.005
          });
        }
      }, 100);
    }
  }, [places, route]);

  const initMap = () => {
    if (!mapRef.current || !window.longdo) return;

    const map = new window.longdo.Map({
      placeholder: mapRef.current,
      lastView: false,
      zoom: 13,
      location: { lon: 102.7880, lat: 17.4138 }
    });

    map.Layers.setBase(window.longdo.Layers.GRAY);
    map.Layers.add(window.longdo.Layers.TRAFFIC);

    mapInstance.current = map;
    updateMarkers();
  };

  // Update markers and route
  useEffect(() => {
    if (mapInstance.current) {
      updateMarkers();
      if (route) {
        if (route.hasNavigation) {
          drawNavigationRoute();
        } else {
          drawStraightRoute();
        }
      } else {
        clearRoutes();
      }
    }
  }, [places, route, updateMarkers, drawNavigationRoute, drawStraightRoute, clearRoutes]);

  // Focus on selected place
  useEffect(() => {
    if (selectedPlace && mapInstance.current) {
      mapInstance.current.location(
        { lon: selectedPlace.lon, lat: selectedPlace.lat },
        true
      );
      mapInstance.current.zoom(17);
    }
  }, [selectedPlace]);

  if (!apiKey) {
    return (
      <div className="w-full h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลดแผนที่...</div>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://api.longdo.com/map/?key=${apiKey}`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <style jsx global>{`
       @keyframes pulse {
         0% {
           transform: scale(1);
           opacity: 1;
         }
         50% {
           transform: scale(1.5);
           opacity: 0.5;
         }
         100% {
           transform: scale(2);
           opacity: 0;
         }
       }
     `}</style>
      <div className="w-full bg-white rounded-lg shadow-md overflow-hidden relative">
        <div ref={mapRef} className="w-full h-[600px]" />

        {/* แสดง Loading เมื่อกำลังวาดเส้นทาง */}
        {isDrawingRoute && (
          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">กำลังวาดเส้นทาง...</span>
          </div>
        )}

        {/* แสดงข้อมูลเส้นทางบนแผนที่ */}
        {route && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">เริ่มต้น:</span>
                <span className="text-gray-600 truncate">{route.route[0].name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">สิ้นสุด:</span>
                <span className="text-gray-600 truncate">{route.route[route.route.length - 1].name}</span>
              </div>
              <div className="pt-1 mt-1 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  📏 {route.totalDistance} กม. • ⏱️ {route.totalTime} นาที
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ปุ่มควบคุมแผนที่ */}
        {route && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => {
                if (mapInstance.current) {
                  const displayPlaces = route.route;
                  const bounds = displayPlaces.reduce((acc, place) => {
                    return {
                      minLon: Math.min(acc.minLon, place.lon),
                      maxLon: Math.max(acc.maxLon, place.lon),
                      minLat: Math.min(acc.minLat, place.lat),
                      maxLat: Math.max(acc.maxLat, place.lat)
                    };
                  }, {
                    minLon: displayPlaces[0].lon,
                    maxLon: displayPlaces[0].lon,
                    minLat: displayPlaces[0].lat,
                    maxLat: displayPlaces[0].lat
                  });

                  mapInstance.current.bound({
                    minLon: bounds.minLon - 0.005,
                    maxLon: bounds.maxLon + 0.005,
                    minLat: bounds.minLat - 0.005,
                    maxLat: bounds.maxLat + 0.005
                  });
                }
              }}
              className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50"
              aria-label="Fit bounds"
              title="ดูเส้นทางทั้งหมด"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            <button
              onClick={() => {
                if (mapInstance.current) {
                  mapInstance.current.zoom(mapInstance.current.zoom() + 1);
                }
              }}
              className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50"
              aria-label="Zoom in"
              title="ซูมเข้า"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={() => {
                if (mapInstance.current) {
                  mapInstance.current.zoom(mapInstance.current.zoom() - 1);
                }
              }}
              className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50"
              aria-label="Zoom out"
              title="ซูมออก"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            {/* Toggle Traffic Layer */}
            <button
              onClick={() => {
                if (mapInstance.current) {
                  const trafficLayer = window.longdo.Layers.TRAFFIC;
                  if (mapInstance.current.Layers.contains(trafficLayer)) {
                    mapInstance.current.Layers.remove(trafficLayer);
                  } else {
                    mapInstance.current.Layers.add(trafficLayer);
                  }
                }
              }}
              className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50"
              aria-label="Toggle traffic"
              title="เปิด/ปิด การจราจร"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </button>
          </div>
        )}

        {/* Legend สำหรับหมุด */}
        {route && route.route.length > 2 && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>จุดเริ่มต้น</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>จุดส่งพัสดุ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>จุดสิ้นสุด</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}