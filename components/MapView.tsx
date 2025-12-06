import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ProcessedImage } from '../types';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';

interface MapViewProps {
  data: ProcessedImage[];
}

// Component to handle auto-zooming to fit all markers
const MapController = ({ markers, isFullscreen }: { markers: ProcessedImage[], isFullscreen: boolean }) => {
  const map = useMap();

  // Fix rendering issues when container size changes or on load
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map, isFullscreen]);

  // Fit bounds when markers change
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude!, m.longitude!]));
      // Add a small delay to ensure size is valid before fitting bounds
      setTimeout(() => {
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }, 200);
    }
  }, [markers, map, isFullscreen]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ data }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Filter out items without valid coordinates
  const validData = useMemo(() => {
    return data.filter(item => 
      item.latitude !== null && 
      item.longitude !== null && 
      item.latitude !== 0 && 
      item.longitude !== 0
    );
  }, [data]);

  if (validData.length === 0) return null;

  // Create a custom icon for each image
  const createCustomIcon = (previewUrl: string) => {
    return new L.DivIcon({
      html: `
        <div class="relative group">
          <div class="w-12 h-12 rounded-md border-2 border-white shadow-lg overflow-hidden bg-white transform transition-transform hover:scale-110">
            <img src="${previewUrl}" class="w-full h-full object-cover" />
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-sm"></div>
        </div>
      `,
      className: 'custom-marker-icon', // Remove default leaflet styles
      iconSize: [48, 48],
      iconAnchor: [24, 54], // Center horizontally, bottom tip vertically
      popupAnchor: [0, -60]
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      className={`
        bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300
        ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'relative rounded-xl w-full'}
      `}
    >
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <MapPin className="text-slate-500 w-5 h-5" />
          <h3 className="font-semibold text-slate-700">Geographic Distribution</h3>
        </div>
        <button 
          onClick={toggleFullscreen}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
      
      <div className={`w-full relative z-0 ${isFullscreen ? 'flex-1' : 'h-[500px]'}`}>
        <MapContainer 
          center={[0, 0]} 
          zoom={2} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController markers={validData} isFullscreen={isFullscreen} />

          {validData.map((item, index) => (
            <Marker 
              key={`${item.fileName}-${index}`} 
              position={[item.latitude!, item.longitude!]}
              icon={createCustomIcon(item.previewUrl)}
            >
              <Popup className="custom-popup">
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-100">
                    <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{item.fileName}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{item.address}</p>
                    <div className="flex gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>{item.latitude?.toFixed(5)}</span>
                      <span>{item.longitude?.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
