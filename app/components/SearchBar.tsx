'use client';

import { useState, useEffect, useRef } from 'react';
import { LongdoSearchResult } from '../types/longdo';

interface SearchBarProps {
    onAddPlace: (place: LongdoPlace) => void;  // แก้จาก any
  }

export default function SearchBar({ onAddPlace }: SearchBarProps) {
    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState<LongdoSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (keyword.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
                const data = await response.json();
                setSuggestions(data.data || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Search error:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, [keyword]);

    const handleSelectSuggestion = async (suggestion: LongdoSearchResult) => {
        setKeyword(suggestion.w);
        setShowSuggestions(false);

        try {
            const response = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: suggestion.w })
            });

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                const place = data.data[0];
                onAddPlace({
                    id: Date.now().toString(),
                    name: suggestion.w,
                    address: suggestion.d,
                    lat: place.lat,
                    lon: place.lon
                });
                setKeyword('');
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
        }
    };

    return (
        <div className="w-full bg-white rounded-lg shadow-md p-4">
            <div className="relative" ref={suggestionsRef}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="ค้นหาสถานที่ หรือพิมพ์ที่อยู่..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                                <div className="font-medium text-gray-800">
                                    {suggestion.w.replace(/<[^>]*>/g, '')}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {suggestion.d.replace(/<[^>]*>/g, '')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}