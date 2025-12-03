import React, { useState, useCallback } from 'react';
import { Dropzone } from './components/Dropzone';
import { ResultsTable } from './components/ResultsTable';
import { ProcessedImage, ProcessingStatus } from './types';
import { processImageBatch } from './services/geminiService';
import { Loader2, Trash2, Zap, Play, X, Image as ImageIcon } from 'lucide-react';

const BATCH_SIZE = 10;

interface QueueItem {
  file: File;
  id: string;
  preview: string;
}

const App: React.FC = () => {
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progress, setProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 });

  const handleFilesSelected = useCallback((files: File[]) => {
    const newItems = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      preview: URL.createObjectURL(file)
    }));
    
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleClearQueue = () => {
    queue.forEach(item => URL.revokeObjectURL(item.preview));
    setQueue([]);
  };

  const handleProcessQueue = async () => {
    if (queue.length === 0) return;

    setStatus(ProcessingStatus.PROCESSING);
    // Snapshot the queue to process
    const itemsToProcess = [...queue];
    
    // Initialize progress
    setProgress({ processed: 0, total: itemsToProcess.length });
    
    // Clear previous results for a fresh batch run
    setResults([]); 
    
    // Clear queue UI immediately (optional, but prevents double submission)
    setQueue([]);

    const chunks = [];
    for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
      chunks.push(itemsToProcess.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;
    const allResults: ProcessedImage[] = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunkItems = chunks[i];
        const chunkFiles = chunkItems.map(item => item.file);
        
        // Call Gemini Service
        const batchResults = await processImageBatch(chunkFiles);

        // Map results back to the original files in this chunk
        const mappedResults: ProcessedImage[] = chunkItems.map((item, index) => {
          const geminiData = batchResults[index];
          
          return {
            originalFile: item.file,
            fileName: item.file.name,
            previewUrl: item.preview, // Reuse the preview from queue
            address: geminiData?.address || "Processing Error",
            latitude: geminiData?.latitude || 0,
            longitude: geminiData?.longitude || 0,
            date: geminiData?.date || "",
            time: geminiData?.time || ""
          };
        });

        allResults.push(...mappedResults);
        processedCount += chunkItems.length;
        
        // Update state progressively
        setResults(prev => [...prev, ...mappedResults]);
        setProgress({ processed: processedCount, total: itemsToProcess.length });
      }
      
      setStatus(ProcessingStatus.COMPLETED);

    } catch (error) {
      console.error("Orchestration Error:", error);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleClearResults = () => {
    // Revoke object URLs to avoid memory leaks
    results.forEach(r => URL.revokeObjectURL(r.previewUrl));
    setResults([]);
    setStatus(ProcessingStatus.IDLE);
    setProgress({ processed: 0, total: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
               <Zap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">GeoPix Extractor</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Queue your photos below, then process them in batches to extract GPS coordinates, addresses, dates, and times.
          </p>
        </div>

        {/* Processing State */}
        {status === ProcessingStatus.PROCESSING ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center space-y-6">
               <div className="relative inline-flex">
                 <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-xs font-bold text-indigo-600">{Math.round((progress.processed / progress.total) * 100)}%</span>
                 </div>
               </div>
               <div>
                 <h3 className="text-xl font-medium text-slate-900">Processing Images</h3>
                 <p className="text-slate-500 mt-2">
                   Analyzing {progress.processed} of {progress.total} photos using Gemini 2.5...
                 </p>
               </div>
               <div className="w-full max-w-lg mx-auto h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(progress.processed / Math.max(progress.total, 1)) * 100}%` }}
                 />
               </div>
          </div>
        ) : (
          /* Input Area */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <Dropzone onFilesSelected={handleFilesSelected} disabled={false} />
            </div>

            {/* Staging Queue */}
            {queue.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="text-slate-500 w-5 h-5" />
                    <h3 className="font-semibold text-slate-700">Images in Queue ({queue.length})</h3>
                  </div>
                  <button 
                    onClick={handleClearQueue}
                    className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                  >
                    Clear Queue
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {queue.map((item) => (
                      <div key={item.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src={item.preview} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveFromQueue(item.id)}
                          className="absolute top-1 right-1 p-1 bg-white/90 text-slate-600 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleProcessQueue}
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Play size={20} fill="currentColor" />
                      <span>Start Processing ({queue.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        {results.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                Results <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{results.length}</span>
              </h2>
              <button 
                onClick={handleClearResults}
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                <span>Clear All</span>
              </button>
            </div>
            
            <ResultsTable data={results} />
          </div>
        )}

      </div>
    </div>
  );
};

export default App;