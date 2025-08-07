import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    
    if (!keyword || keyword.length < 3) {
      return NextResponse.json({ data: [], meta: { keyword: keyword || '' } });
    }

    const apiKey = process.env.LONGDO_MAP_API_KEY;
    
    if (!apiKey) {
      console.error('Longdo API key is not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // เพิ่ม parameter area=41 สำหรับจังหวัดอุดรธานี
    const response = await fetch(
      `https://search.longdo.com/mapsearch/json/suggest?keyword=${encodeURIComponent(keyword)}&area=41&limit=10&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}