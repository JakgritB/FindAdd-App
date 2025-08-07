import { NextRequest, NextResponse } from 'next/server';

interface Location {
  lat: number;
  lon: number;
  name: string;
  id: string;
}

// คำนวณระยะทางแบบ Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Nearest Neighbor Algorithm
function findOptimalRoute(start: Location, destinations: Location[]): Location[] {
  const route: Location[] = [start];
  const unvisited = [...destinations];
  let current = start;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        current.lat, current.lon,
        unvisited[i].lat, unvisited[i].lon
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = i;
      }
    }

    current = unvisited[nearestIndex];
    route.push(current);
    unvisited.splice(nearestIndex, 1);
  }

  return route;
}

// เรียก Longdo Route API สำหรับเส้นทางจริง
async function getLongdoRoute(waypoints: Location[], apiKey: string) {
  try {
    const routeSegments = [];
    let totalDistance = 0;
    let totalTime = 0;
    const allPaths = [];

    // เรียก API สำหรับแต่ละช่วง
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      // เรียก Longdo Route API
      const response = await fetch(
        `https://api.longdo.com/RouteService/json/route/guide` +
        `?flon=${start.lon}&flat=${start.lat}` +
        `&tlon=${end.lon}&tlat=${end.lat}` +
        `&mode=d&type=25&locale=th&key=${apiKey}`
      );

      if (!response.ok) {
        console.error('Longdo Route API error for segment', i);
        continue;
      }

      const data = await response.json();
      
      if (data && data.data) {
        // ดึงข้อมูลเส้นทาง
        const segmentData = {
          from: start,
          to: end,
          distance: (data.data[0]?.distance || 0) / 1000, // แปลงเป็นกิโลเมตร
          time: data.data[0]?.interval || 0, // เวลาเป็นวินาที
          path: data.data[0]?.path || [], // พิกัดเส้นทาง
          guide: data.guide || [] // คำแนะนำการเดินทาง
        };

        routeSegments.push(segmentData);
        totalDistance += segmentData.distance;
        totalTime += segmentData.time;
        
        // เก็บ path สำหรับวาดเส้นทาง
        if (segmentData.path && segmentData.path.length > 0) {
          allPaths.push(...segmentData.path);
        }
      }
    }

    return {
      segments: routeSegments,
      totalDistance,
      totalTime: Math.ceil(totalTime / 60), // แปลงเป็นนาที
      paths: allPaths
    };
  } catch (error) {
    console.error('Error calling Longdo Route API:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { startLocation, destinations } = await request.json();
    
    if (!startLocation || !destinations || destinations.length === 0) {
      return NextResponse.json({ 
        error: 'ต้องมีจุดเริ่มต้นและปลายทางอย่างน้อย 1 จุด' 
      }, { status: 400 });
    }

    const apiKey = process.env.LONGDO_MAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not configured' 
      }, { status: 500 });
    }

    // คำนวณเส้นทางที่เหมาะสม
    const optimizedRoute = findOptimalRoute(startLocation, destinations);
    
    // เรียก Longdo Route API สำหรับเส้นทางนำทางจริง
    const routeData = await getLongdoRoute(optimizedRoute, apiKey);
    
    if (routeData) {
      return NextResponse.json({
        success: true,
        route: optimizedRoute,
        segments: routeData.segments,
        totalDistance: routeData.totalDistance.toFixed(2),
        totalTime: routeData.totalTime,
        paths: routeData.paths,
        hasNavigation: true
      });
    } else {
      // Fallback ถ้า API ไม่ทำงาน
      let totalDistance = 0;
      const segments = [];
      
      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        const distance = calculateDistance(
          optimizedRoute[i].lat,
          optimizedRoute[i].lon,
          optimizedRoute[i + 1].lat,
          optimizedRoute[i + 1].lon
        );
        
        totalDistance += distance;
        
        segments.push({
          from: optimizedRoute[i],
          to: optimizedRoute[i + 1],
          distance: distance.toFixed(2),
          time: Math.ceil(distance * 3)
        });
      }

      return NextResponse.json({
        success: true,
        route: optimizedRoute,
        segments,
        totalDistance: totalDistance.toFixed(2),
        totalTime: Math.ceil(totalDistance * 3),
        hasNavigation: false
      });
    }
    
  } catch (error) {
    console.error('Route planning error:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการคำนวณเส้นทาง' 
    }, { status: 500 });
  }
}