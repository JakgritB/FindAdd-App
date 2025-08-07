'use client';

import { useState, useEffect, useRef } from 'react';
import { RouteResponse } from '../types/longdo';

interface NavigationModeProps {
  route: RouteResponse;
  onUpdatePosition: (lat: number, lon: number) => void;
  onClose: () => void;
}

export default function NavigationMode({ route, onUpdatePosition, onClose }: NavigationModeProps) {
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [nextTurn, setNextTurn] = useState<string>('');
  const [distanceToNext, setDistanceToNext] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [speed, setSpeed] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  // คำนวณระยะทางระหว่าง 2 จุด
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // รัศมีโลกเป็นเมตร
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // ระยะทางเป็นเมตร
  };

  // เริ่มการนำทาง
  const startNavigation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      return;
    }

    setIsNavigating(true);

    // ติดตาม GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
        setSpeed(position.coords.speed || 0);
        
        // อัปเดตตำแหน่งบนแผนที่
        onUpdatePosition(position.coords.latitude, position.coords.longitude);
        
        // ตรวจสอบว่าถึงจุดหมายหรือยัง
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
      // ถึงจุดหมายแล้ว
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

    // ถ้าใกล้จุดต่อไปแล้ว (น้อยกว่า 50 เมตร)
    if (distance < 50) {
      setCurrentSegmentIndex(prev => prev + 1);
      speakDirection(`ถึง ${nextPoint.name} แล้ว จุดต่อไปคือ ${route.route[currentSegmentIndex + 2]?.name || 'จุดหมายสุดท้าย'}`);
    }

    // อัปเดตคำแนะนำการเลี้ยว
    updateTurnInstructions(position, nextPoint);
  };

  // อัปเดตคำแนะนำการเลี้ยว
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

  // พูดคำแนะนำ (Web Speech API)
  const speakDirection = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  // หยุดการนำทาง
  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopNavigation();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
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
      </div>

      {/* Navigation Info */}
      <div className="flex-1 overflow-auto">
        {/* Current Status */}
        <div className="bg-gray-100 p-4 border-b">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {distanceToNext > 1000 
                ? `${(distanceToNext / 1000).toFixed(1)} กม.`
                : `${Math.round(distanceToNext)} ม.`
              }
            </div>
            <div className="text-xl text-gray-700 mt-2">{nextTurn}</div>
            {speed > 0 && (
              <div className="text-sm text-gray-500 mt-1">
                ความเร็ว: {(speed * 3.6).toFixed(0)} กม./ชม.
              </div>
            )}
          </div>
        </div>

        {/* Destination Info */}
        <div className="p-4 bg-white">
          <h3 className="font-semibold text-lg mb-2">กำลังไปยัง:</h3>
          {currentSegmentIndex < route.route.length - 1 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium">
                📍 {route.route[currentSegmentIndex + 1].name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {route.route[currentSegmentIndex + 1].address}
              </div>
            </div>
          )}
        </div>

        {/* Route Progress */}
        <div className="p-4">
          <h3 className="font-semibold mb-2">ความคืบหน้า:</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {currentSegmentIndex + 1} / {route.route.length} จุด
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {Math.round(((currentSegmentIndex + 1) / route.route.length) * 100)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div 
                style={{ width: `${((currentSegmentIndex + 1) / route.route.length) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
              ></div>
            </div>
          </div>
        </div>

        {/* Next Destinations */}
        <div className="p-4">
          <h3 className="font-semibold mb-2">จุดหมายถัดไป:</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {route.route.slice(currentSegmentIndex + 1).map((place, index) => (
              <div 
                key={place.id}
                className={`p-2 rounded-lg ${
                  index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    {currentSegmentIndex + index + 2}.
                  </span>
                  <span className="text-sm font-medium">
                    {place.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-4 bg-white border-t">
        {!isNavigating ? (
          <button
            onClick={startNavigation}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            เริ่มนำทาง
          </button>
        ) : (
          <button
            onClick={stopNavigation}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            หยุดนำทาง
          </button>
        )}
      </div>
    </div>
  );
}