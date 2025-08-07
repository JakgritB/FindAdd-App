'use client';

import { useState } from 'react';
import SearchBar from './components/SearchBar';
import PlacesList from './components/PlacesList';
import RoutePanel from './components/RoutePanel';
import ExportPanel from './components/ExportPanel';
import LongdoMap from './components/LongdoMap';
import NavigationMode from './components/NavigationMode';
import { LongdoPlace, RouteResponse } from './types/longdo';

export default function Home() {
  const [places, setPlaces] = useState<LongdoPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<LongdoPlace | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteResponse | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [currentUserPosition, setCurrentUserPosition] = useState<{lat: number, lon: number} | null>(null);

  const handleAddPlace = (place: LongdoPlace) => {
    if (places.length >= 60) {
      alert('คุณเพิ่มสถานที่ได้สูงสุด 60 สถานที่');
      return;
    }

    const exists = places.some(p => 
      p.lat === place.lat && p.lon === place.lon
    );
    
    if (exists) {
      alert('สถานที่นี้ถูกเพิ่มแล้ว');
      return;
    }

    setPlaces([...places, place]);
    setCalculatedRoute(null);
  };

  const handleRemovePlace = (id: string) => {
    setPlaces(places.filter(p => p.id !== id));
    setCalculatedRoute(null);
  };

  const handleSelectPlace = (place: LongdoPlace) => {
    setSelectedPlace(place);
  };

  const handleRouteCalculated = (route: RouteResponse | null) => {
    setCalculatedRoute(route);
  };

  const handleStartNavigation = () => {
    if (!calculatedRoute) {
      alert('กรุณาคำนวณเส้นทางก่อน');
      return;
    }
    
    if (window.confirm('เริ่มการนำทางในแอพ?\n\n⚠️ คำเตือน:\n- ต้องเปิดหน้าจอตลอดการนำทาง\n- ใช้แบตเตอรี่มาก\n- ความแม่นยำขึ้นอยู่กับ GPS ของอุปกรณ์')) {
      setShowNavigation(true);
    }
  };

  const handleUpdatePosition = (lat: number, lon: number) => {
    setCurrentUserPosition({ lat, lon });
  };

  const handleCloseNavigation = () => {
    setShowNavigation(false);
    setCurrentUserPosition(null);
  };

  // ถ้าอยู่ในโหมดนำทาง แสดง NavigationMode แทน
  if (showNavigation && calculatedRoute) {
    return (
      <NavigationMode
        route={calculatedRoute}
        onUpdatePosition={handleUpdatePosition}
        onClose={handleCloseNavigation}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🚚 FindAdd - ระบบนำทางส่งพัสดุอัจฉริยะ
          </h1>
          <p className="text-gray-600 mt-2">
            📍 ค้นหาสถานที่ในจังหวัดอุดรธานี | คำนวณเส้นทางที่ดีที่สุด | นำทางด้วย GPS
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <SearchBar onAddPlace={handleAddPlace} />
            <PlacesList 
              places={places}
              onRemovePlace={handleRemovePlace}
              onSelectPlace={handleSelectPlace}
            />
            <RoutePanel 
              places={places}
              onRouteCalculated={handleRouteCalculated}
              onStartNavigation={handleStartNavigation}
            />
            {calculatedRoute && (
              <ExportPanel 
                places={places}
                route={calculatedRoute}
              />
            )}
          </div>
          
          <div className="lg:col-span-2">
            <LongdoMap 
              places={places}
              selectedPlace={selectedPlace}
              route={calculatedRoute}
              userPosition={currentUserPosition}
            />
            
            {places.length === 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">📖 วิธีใช้งาน:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. 🔍 ค้นหาและเพิ่มที่อยู่ลูกค้าที่ต้องการส่งพัสดุ</li>
                  <li>2. 📍 เพิ่มได้สูงสุด 60 ที่อยู่</li>
                  <li>3. 🗺️ กดคำนวณเส้นทางนำทาง เพื่อหาลำดับการส่งที่ดีที่สุด</li>
                  <li>4. 🚗 เลือกนำทางในแอพ หรือเปิดใน Google Maps</li>
                  <li>5. 📤 ส่งออกหรือแชร์เส้นทางให้คนขับ</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}