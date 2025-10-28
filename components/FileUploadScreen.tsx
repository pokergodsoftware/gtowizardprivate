import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileChange: (files: FileList) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFileChange(files);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [onFileChange]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-gray-800' : 'border-gray-600 hover:border-blue-400'}`}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept=".zip"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-2">
        <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <p className="text-gray-400">
          <span className="font-semibold text-blue-400">Clique para fazer upload</span> ou arraste e solte os arquivos
        </p>
        <p className="text-xs text-gray-500">Apenas arquivos ZIP</p>
      </label>
    </div>
  );
};