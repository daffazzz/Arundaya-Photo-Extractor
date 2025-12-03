import React, { useState, useMemo } from 'react';
import { MapPin, AlertCircle, Copy, Check, FileSpreadsheet, X, ZoomIn } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ResultsTableProps {
  data: ProcessedImage[];
}

const formatCoordinate = (value: number | null, type: 'lat' | 'lng'): string => {
  // Check for strict null/undefined or the 0 placeholder from service
  if (value === null || value === undefined || value === 0) return '--';

  const absoluteValue = Math.abs(value);
  const degrees = absoluteValue.toFixed(6);
  
  let direction = '';
  if (type === 'lat') {
    direction = value >= 0 ? 'N' : 'S';
  } else {
    direction = value >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${direction}`;
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => 
      a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [data]);

  if (sortedData.length === 0) return null;

  const handleCopy = () => {
    const headers = ['File Name', 'Address', 'Latitude', 'Longitude', 'Date', 'Time'];
    const tsvRows = sortedData.map(item => {
      const lat = formatCoordinate(item.latitude, 'lat');
      const lng = formatCoordinate(item.longitude, 'lng');
      const cleanAddress = (item.address || '').replace(/[\t\n\r]/g, ' ').trim();
      
      return [
        item.fileName,
        cleanAddress,
        lat === '--' ? '' : lat,
        lng === '--' ? '' : lng,
        item.date || '',
        item.time || ''
      ].join('\t');
    });

    const tsv = [headers.join('\t'), ...tsvRows].join('\n');
    
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="w-full bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700">Extraction Results</h3>
          <button
            onClick={handleCopy}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${copied 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300'
              }
            `}
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Copied for Excel</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} />
                <span>Copy Table</span>
              </>
            )}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">#</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Photo</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Latitude</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Longitude</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.map((item, index) => (
                <tr key={`${item.fileName}-${index}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3">
                    <button 
                      onClick={() => setSelectedImage(item)}
                      className="group relative h-12 w-12 rounded bg-slate-100 border border-slate-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <img 
                        src={item.previewUrl} 
                        alt="" 
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-sm" />
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900 select-all">
                    {item.fileName}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700 select-all">
                    {item.address}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700 font-mono select-all whitespace-nowrap">
                     {formatCoordinate(item.latitude, 'lat')}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700 font-mono select-all whitespace-nowrap">
                     {formatCoordinate(item.longitude, 'lng')}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700 font-mono select-all whitespace-nowrap">
                     {item.date || '--'}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700 font-mono select-all whitespace-nowrap">
                     {item.time || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white z-10">
              <h3 className="text-lg font-semibold text-slate-800 truncate pr-4">
                {selectedImage.fileName}
              </h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center min-h-[300px]">
              <img 
                src={selectedImage.previewUrl} 
                alt={selectedImage.fileName} 
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm" 
              />
            </div>
            
            <div className="px-6 py-4 bg-white border-t border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div className="col-span-2 md:col-span-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Address</span>
                  <p className="text-slate-700">{selectedImage.address}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Latitude</span>
                  <p className="text-slate-700 font-mono text-base">{formatCoordinate(selectedImage.latitude, 'lat')}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Longitude</span>
                  <p className="text-slate-700 font-mono text-base">{formatCoordinate(selectedImage.longitude, 'lng')}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
                  <p className="text-slate-700 font-mono text-base">{selectedImage.date || '--'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Time</span>
                  <p className="text-slate-700 font-mono text-base">{selectedImage.time || '--'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};