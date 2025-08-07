'use client';

import { LongdoPlace } from '../types/longdo';

interface PlacesListProps {
  places: LongdoPlace[];
  onRemovePlace: (id: string) => void;
  onSelectPlace: (place: LongdoPlace) => void;
}

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '');
};

export default function PlacesList({ places, onRemovePlace, onSelectPlace }: PlacesListProps) {
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">
        สถานที่ที่เพิ่มแล้ว ({places.length}/60)
      </h3>

      {places.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          ยังไม่มีสถานที่ที่เพิ่ม
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {places.map((place, index) => (
            <div
              key={place.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectPlace(place)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-800">
                    {stripHtml(place.name)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stripHtml(place.address)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlace(place.id);
                }}
                className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}