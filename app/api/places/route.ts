import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;
    
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const apiKey = process.env.LONGDO_MAP_API_KEY;
    
    if (!apiKey) {
      console.error('Longdo API key is not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // เพิ่ม area=41 สำหรับจังหวัดอุดรธานี
    const response = await fetch(
      `https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(keyword)}&area=41&limit=1&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}