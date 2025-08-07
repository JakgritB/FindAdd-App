'use client';

import { useState } from 'react';
import { LongdoPlace, RouteResponse } from '../types/longdo';

interface RoutePanelProps {
  places: LongdoPlace[];
  onRouteCalculated: (route: RouteResponse) => void;
  onStartNavigation?: () => void;
}

export default function RoutePanel({ places, onRouteCalculated, onStartNavigation }: RoutePanelProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [startLocation, setStartLocation] = useState<LongdoPlace | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const getCurrentLocation = (): Promise<LongdoPlace> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            id: 'current',
            name: '📍 ตำแหน่งปัจจุบัน',
            address: 'GPS Location',
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const calculateRoute = async () => {
    if (places.length === 0) {
      alert('กรุณาเพิ่มสถานที่ก่อนคำนวณเส้นทาง');
      return;
    }

    setIsCalculating(true);
    
    try {
      let start: LongdoPlace;
      
      if (useCurrentLocation) {
        try {
          start = await getCurrentLocation();
          setStartLocation(start);
        } catch (error) {
          alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง');
          setIsCalculating(false);
          return;
        }
      } else {
        start = places[0];
        setStartLocation(start);
      }

      const destinations = useCurrentLocation ? places : places.slice(1);
      
      const response = await fetch('/api/route-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLocation: start,
          destinations: destinations
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRoute(data);
        onRouteCalculated(data);
      } else {
        alert('เกิดข้อผิดพลาดในการคำนวณเส้นทาง');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      alert('เกิดข้อผิดพลาดในการคำนวณเส้นทาง');
    } finally {
      setIsCalculating(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setStartLocation(null);
    onRouteCalculated(null as any);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
    return `${mins} นาที`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>🗺️ เส้นทางนำทาง</span>
        {route && route.hasNavigation && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            GPS Navigation
          </span>
        )}
      </h3>

      {!route ? (
        <>
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-sm">ใช้ตำแหน่ง GPS ปัจจุบันเป็นจุดเริ่มต้น</span>
            </label>
            {!useCurrentLocation && places.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                หรือจะใช้ "{places[0]?.name}" เป็นจุดเริ่มต้น
              </p>
            )}
          </div>

          <button
            onClick={calculateRoute}
            disabled={isCalculating || places.length === 0}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isCalculating || places.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>กำลังคำนวณเส้นทาง...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>คำนวณเส้นทางนำทาง</span>
              </>
            )}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          {/* สรุปผล */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-gray-600">ระยะทาง:</span>
                <span className="font-bold text-blue-900">{route.totalDistance} กม.</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">เวลา:</span>
                <span className="font-bold text-blue-900">{formatTime(route.totalTime)}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600">จุดส่ง:</span>
                <span className="font-bold text-blue-900">{route.route.length - 1} จุด</span>
              </div>
            </div>
          </div>

          {/* ลำดับการส่ง */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              ลำดับการนำทาง:
            </h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {route.route.map((location, index) => (
                <div
                  key={location.id}
                  className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                    index === 0 
                      ? 'bg-green-50 border border-green-200' 
                      : index === route.route.length - 1
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 
                      ? 'bg-green-500 text-white' 
                      : index === route.route.length - 1
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {index === 0 ? '🚚' : index === route.route.length - 1 ? '🏁' : index}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{location.name}</div>
                    <div className="text-gray-500 text-xs">{location.address}</div>
                    {route.segments && route.segments[index] && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-blue-600">
                          ↓ {route.segments[index].distance} กม.
                        </span>
                        <span className="text-xs text-gray-500">
                          ~{route.segments[index].time ? Math.ceil(route.segments[index].time / 60) : route.segments[index].estimatedTime} นาที
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex gap-2">
            <button
              onClick={clearRoute}
              className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ล้างเส้นทาง
            </button>
            <button
              onClick={() => {
                const start = route.route[0];
                const waypoints = route.route.slice(1, -1)
                  .map(p => `${p.lat},${p.lon}`)
                  .join('|');
                const end = route.route[route.route.length - 1];
                
                const url = `https://www.google.com/maps/dir/${start.lat},${start.lon}/${waypoints ? waypoints + '/' : ''}${end.lat},${end.lon}`;
                window.open(url, '_blank');
              }}
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              เปิดใน Google Maps
            </button>
          </div>
          
          {/* ปุ่มนำทางในแอพ */}
          {onStartNavigation && (
            <button
              onClick={onStartNavigation}
              className="w-full py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              นำทางในแอพ (Beta)
            </button>
          )}
        </div>
      )}
    </div>
  );
}