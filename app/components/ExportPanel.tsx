'use client';

import { LongdoPlace, RouteResponse } from '../types/longdo';

interface ExportPanelProps {
  places: LongdoPlace[];
  route: RouteResponse | null;
}

export default function ExportPanel({ places, route }: ExportPanelProps) {
  
  const exportToCSV = () => {
    if (!route) {
      alert('กรุณาคำนวณเส้นทางก่อน');
      return;
    }

    const data = route.route.map((place, index) => ({
      ลำดับ: index + 1,
      ชื่อสถานที่: place.name,
      ที่อยู่: place.address,
      ละติจูด: place.lat,
      ลองจิจูด: place.lon,
      ระยะทางจากจุดก่อนหน้า: route.segments[index - 1]?.distance || '-',
      เวลาเดินทาง: route.segments[index - 1]?.time 
       // ? `${Math.ceil(route.segments[index - 1].time / 60)} นาที` 
        //: '-'
    }));

    // สร้าง CSV content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = '\ufeff' + [headers, ...rows].join('\n'); // Add BOM for Thai support

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `route_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const shareRoute = () => {
    if (!route) {
      alert('กรุณาคำนวณเส้นทางก่อน');
      return;
    }

    // สร้างข้อความสำหรับแชร์
    const text = `🚚 เส้นทางส่งพัสดุ (${route.route.length - 1} จุด)\n` +
      `📏 ระยะทางรวม: ${route.totalDistance} กม.\n` +
      `⏱️ เวลาประมาณ: ${route.totalTime} นาที\n\n` +
      `ลำดับการส่ง:\n` +
      route.route.map((place, index) => 
        `${index + 1}. ${place.name}\n   ${place.address}`
      ).join('\n\n');

    // ถ้ารองรับ Web Share API
    if (navigator.share) {
      navigator.share({
        title: 'เส้นทางส่งพัสดุ',
        text: text
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        alert('คัดลอกเส้นทางแล้ว สามารถวางในแอปอื่นได้');
      });
    }
  };

  const printRoute = () => {
    if (!route) {
      alert('กรุณาคำนวณเส้นทางก่อน');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>เส้นทางส่งพัสดุ - ${new Date().toLocaleDateString('th-TH')}</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 20px; }
          h1 { color: #1e40af; }
          .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .route-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .route-item:last-child { border-bottom: none; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .start { background: #10b981; color: white; }
          .end { background: #ef4444; color: white; }
          .normal { background: #3b82f6; color: white; }
        </style>
      </head>
      <body>
        <h1>🚚 เส้นทางส่งพัสดุ</h1>
        <div class="summary">
          <p><strong>วันที่:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
          <p><strong>จำนวนจุดส่ง:</strong> ${route.route.length - 1} จุด</p>
          <p><strong>ระยะทางรวม:</strong> ${route.totalDistance} กิโลเมตร</p>
          <p><strong>เวลาเดินทางประมาณ:</strong> ${route.totalTime} นาที</p>
        </div>
        <h2>ลำดับการส่ง:</h2>
        ${route.route.map((place, index) => `
          <div class="route-item">
            <span class="badge ${index === 0 ? 'start' : index === route.route.length - 1 ? 'end' : 'normal'}">
              ${index === 0 ? 'เริ่มต้น' : index === route.route.length - 1 ? 'สิ้นสุด' : `จุดที่ ${index}`}
            </span>
            <h3>${index + 1}. ${place.name}</h3>
            <p>${place.address}</p>
            ${route.segments[index] ? `
              <p style="color: #6b7280; font-size: 14px;">
                ระยะทาง: ${route.segments[index].distance} กม. | 
                เวลา: ${Math.ceil((route.segments[index].time || 0) / 60)} นาที
              </p>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">📤 ส่งออกและแชร์</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={exportToCSV}
          disabled={!route}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            !route 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </button>
        
        <button
          onClick={shareRoute}
          disabled={!route}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            !route 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 4.026A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
          </svg>
          แชร์
        </button>
        
        <button
          onClick={printRoute}
          disabled={!route}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            !route 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          พิมพ์
        </button>
        
        <button
          onClick={() => {
            const start = route?.route[0];
            const end = route?.route[route.route.length - 1];
            if (start && end) {
              const url = `https://www.google.com/maps/dir/${start.lat},${start.lon}/${end.lat},${end.lon}`;
              window.open(url, '_blank');
            }
          }}
          disabled={!route}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            !route 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Maps
        </button>
      </div>
    </div>
  );
}