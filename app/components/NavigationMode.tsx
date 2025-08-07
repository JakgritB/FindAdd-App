'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { RouteResponse } from '../types/longdo';

declare global {
  interface Window {
    longdo: any;
  }
}

interface NavigationModeProps {
  route: RouteResponse;
  onUpdatePosition: (lat: number, lon: number) => void;
  onClose: () => void;
}

export default function NavigationMode({ route, onUpdatePosition, onClose }: NavigationModeProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [nextTurn, setNextTurn] = useState<string>('');
  const [distanceToNext, setDistanceToNext] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [apiKey, setApiKey] = useState<string>('');

  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LongdoMapInstance | null>(null);
  const markersRef = useRef<LongdoMarker[]>([]);
  const routeLinesRef = useRef<LongdoPolyline[]>([]);
  const destinationMarkersRef = useRef<any[]>([]);

  // ดึง API Key
  useEffect(() => {
    fetch('/api/map-config')
      .then(res => res.json())
      .then(data => setApiKey(data.apiKey))
      .catch(err => console.error('Failed to load map config:', err));
  }, []);

  // Initialize Map
  const initMap = () => {
    if (!mapRef.current || !window.longdo) return;

    const startPoint = route.route[0];
    const map = new window.longdo.Map({
      placeholder: mapRef.current,
      lastView: false,
      zoom: 16,
      location: { lon: startPoint.lon, lat: startPoint.lat }
    });

    // เพิ่ม Traffic Layer
    map.Layers.setBase(window.longdo.Layers.NORMAL);
    map.Layers.add(window.longdo.Layers.TRAFFIC);

    mapInstance.current = map;

    // วาดเส้นทาง
    drawRoute();

    // เพิ่มหมุดปลายทาง
    addDestinationMarkers();
  };

  // วาดเส้นทางบนแผนที่
  const drawRoute = () => {
    if (!mapInstance.current || !window.longdo) return;

    // ลบเส้นทางเก่า
    if (routeLineRef.current) {
      mapInstance.current.Overlays.remove(routeLineRef.current);
    }

    // วาดเส้นทางใหม่
    if (route.paths && route.paths.length > 0) {
      const pathCoordinates = route.paths.map((point: any) => ({
        lon: point.lon || point[0],
        lat: point.lat || point[1]
      }));

      const line = new window.longdo.Polyline(pathCoordinates, {
        lineWidth: 6,
        lineColor: 'rgba(59, 130, 246, 0.8)',
        lineStyle: window.longdo.LineStyle.Solid
      });

      mapInstance.current.Overlays.add(line);
      routeLineRef.current = line;
    } else {
      // Fallback: วาดเส้นตรง
      const lineCoordinates = route.route.map(place => ({
        lon: place.lon,
        lat: place.lat
      }));

      const line = new window.longdo.Polyline(lineCoordinates, {
        lineWidth: 5,
        lineColor: 'rgba(59, 130, 246, 0.6)',
        lineStyle: window.longdo.LineStyle.Dashed
      });

      mapInstance.current.Overlays.add(line);
      routeLineRef.current = line;
    }
  };

  // เพิ่มหมุดปลายทาง
  const addDestinationMarkers = () => {
    if (!mapInstance.current || !window.longdo) return;

    // ลบหมุดเก่า
    destinationMarkersRef.current.forEach(marker => {
      mapInstance.current.Overlays.remove(marker);
    });
    destinationMarkersRef.current = [];

    // เพิ่มหมุดใหม่
    route.route.forEach((place, index) => {
      let markerColor = '#3B82F6';
      let markerIcon = (index + 1).toString();

      if (index === 0) {
        markerColor = '#10B981';
        markerIcon = 'S';
      } else if (index === route.route.length - 1) {
        markerColor = '#EF4444';
        markerIcon = 'F';
      }

      const marker = new window.longdo.Marker(
        { lon: place.lon, lat: place.lat },
        {
          title: place.name,
          detail: place.address,
          icon: {
            html: `<div style="
              background: ${markerColor}; 
              color: white; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              border: 2px solid white;
            ">${markerIcon}</div>`,
            offset: { x: 15, y: 15 }
          }
        }
      );

      mapInstance.current.Overlays.add(marker);
      destinationMarkersRef.current.push(marker);
    });
  };

  // อัปเดตตำแหน่งบนแผนที่
  const updateUserPosition = (lat: number, lon: number) => {
    if (!mapInstance.current || !window.longdo) return;

    // ลบ marker เก่า
    if (userMarkerRef.current) {
      mapInstance.current.Overlays.remove(userMarkerRef.current);
    }

    // เพิ่ม marker ใหม่
    const userMarker = new window.longdo.Marker(
      { lon: lon, lat: lat },
      {
        title: 'ตำแหน่งของคุณ',
        icon: {
          html: `
            <div style="position: relative;">
              <div style="
                width: 16px; 
                height: 16px; 
                background: #3B82F6; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>
              <div style="
                position: absolute; 
                top: -8px; 
                left: -8px; 
                width: 32px; 
                height: 32px; 
                background: rgba(59, 130, 246, 0.3); 
                border-radius: 50%; 
                animation: pulse 2s infinite;
              "></div>
            </div>`,
          offset: { x: 8, y: 8 }
        }
      }
    );

    mapInstance.current.Overlays.add(userMarker);
    userMarkerRef.current = userMarker;

    // เลื่อนแผนที่ตามตำแหน่ง
    mapInstance.current.location({ lon: lon, lat: lat }, true);
  };

  // คำนวณระยะทาง
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // เริ่มการนำทาง
  const startNavigation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      return;
    }

    setIsNavigating(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
        setSpeed(position.coords.speed || 0);

        // อัปเดตตำแหน่งบนแผนที่
        updateUserPosition(position.coords.latitude, position.coords.longitude);
        onUpdatePosition(position.coords.latitude, position.coords.longitude);

        // ตรวจสอบการนำทาง
        checkNavigation(position);
      },
      (error) => {
        console.error('GPS Error:', error);
        alert('ไม่สามารถเข้าถึง GPS ได้');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // ตรวจสอบการนำทาง
  const checkNavigation = (position: GeolocationPosition) => {
    if (currentSegmentIndex >= route.route.length - 1) {
      speakDirection('คุณถึงจุดหมายแล้ว');
      stopNavigation();
      return;
    }

    const nextPoint = route.route[currentSegmentIndex + 1];
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      nextPoint.lat,
      nextPoint.lon
    );

    setDistanceToNext(distance);

    if (distance < 50) {
      setCurrentSegmentIndex(prev => prev + 1);
      speakDirection(`ถึง ${nextPoint.name} แล้ว`);

      // Highlight marker ที่ถึงแล้ว
      if (destinationMarkersRef.current[currentSegmentIndex + 1]) {
        // เปลี่ยนสี marker
        mapInstance.current.Overlays.remove(destinationMarkersRef.current[currentSegmentIndex + 1]);

        const completedMarker = new window.longdo.Marker(
          { lon: nextPoint.lon, lat: nextPoint.lat },
          {
            title: `✓ ${nextPoint.name}`,
            icon: {
              html: `<div style="
                background: #10B981; 
                color: white; 
                width: 30px; 
                height: 30px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: bold;
              ">✓</div>`,
              offset: { x: 15, y: 15 }
            }
          }
        );

        mapInstance.current.Overlays.add(completedMarker);
        destinationMarkersRef.current[currentSegmentIndex + 1] = completedMarker;
      }
    }

    updateTurnInstructions(position, nextPoint);
  };

  const updateTurnInstructions = (position: GeolocationPosition, nextPoint: any) => {
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      nextPoint.lat,
      nextPoint.lon
    );

    if (distance > 1000) {
      setNextTurn(`ตรงไปอีก ${(distance / 1000).toFixed(1)} กิโลเมตร`);
    } else if (distance > 100) {
      setNextTurn(`ตรงไปอีก ${Math.round(distance)} เมตร`);
    } else {
      setNextTurn(`ใกล้ถึงแล้ว ${Math.round(distance)} เมตร`);
    }
  };

  const speakDirection = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
  };

  useEffect(() => {
    return () => {
      stopNavigation();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold">🧭 โหมดนำทาง</h2>
          <button
            onClick={() => {
              stopNavigation();
              onClose();
            }}
            className="p-2 hover:bg-blue-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Info Bar */}
        <div className="bg-blue-700 px-4 py-3">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {distanceToNext > 1000
                ? `${(distanceToNext / 1000).toFixed(1)} กม.`
                : `${Math.round(distanceToNext)} ม.`
              }
            </div>
            <div className="text-lg mt-1">{nextTurn}</div>
            {speed > 0 && (
              <div className="text-sm mt-1 opacity-75">
                ความเร็ว: {(speed * 3.6).toFixed(0)} กม./ชม.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {apiKey ? (
          <>
            <Script
              src={`https://api.longdo.com/map/?key=${apiKey}`}
              strategy="afterInteractive"
              onLoad={initMap}
            />
            <div ref={mapRef} className="w-full h-full" />

            {/* Zoom Controls */}
            <div className="absolute bottom-20 right-4 flex flex-col gap-2">
              <button
                onClick={() => mapInstance.current?.zoom(mapInstance.current.zoom() + 1)}
                className="bg-white p-2 rounded-lg shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => mapInstance.current?.zoom(mapInstance.current.zoom() - 1)}
                className="bg-white p-2 rounded-lg shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">กำลังโหลดแผนที่...</div>
          </div>
        )}
      </div>

      {/* Bottom Control Panel */}
      <div className="bg-white border-t shadow-lg">
        <div className="px-4 py-3">
          <div className="text-sm text-gray-600 mb-2">
            กำลังไปยัง: <span className="font-semibold text-gray-900">
              {route.route[currentSegmentIndex + 1]?.name || 'จุดหมายสุดท้าย'}
            </span>
          </div>

          <div className="flex gap-2">
            {!isNavigating ? (
              <button
                onClick={startNavigation}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold"
              >
                เริ่มนำทาง
              </button>
            ) : (
              <button
                onClick={stopNavigation}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold"
              >
                หยุดนำทาง
              </button>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}