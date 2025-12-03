import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (event: Event) => {
      const e = event as ClipboardEvent;
      if (disabled) return;

      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const imageFiles = Array.from(e.clipboardData.files).filter((file: File) => 
          file.type.startsWith('image/')
        );

        if (imageFiles.length > 0) {
          e.preventDefault();
          onFilesSelected(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onFilesSelected, disabled]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) => 
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imageFiles = Array.from(e.target.files).filter((file: File) => 
        file.type.startsWith('image/')
      );
      onFilesSelected(imageFiles);
    }
    // Reset value so same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-300' : 
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[0.99]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 bg-white'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
          <UploadCloud size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-700">
            {isDragging ? 'Drop images here' : 'Click, paste, or drop images here'}
          </p>
          <p className="text-sm text-slate-500">
            Supports JPG, PNG, WEBP. You can select more than 10 files.
          </p>
        </div>
      </div>
    </div>
  );
};