
import React, { useCallback } from 'react';

interface FileUploadProps {
  onFileChange: (files: FileList) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, isLoading }) => {
  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFileChange(files);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 transition-colors duration-300 border-gray-600 hover:border-blue-400`}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        // @ts-ignore - webkitdirectory is a non-standard attribute for folder uploads
        webkitdirectory=""
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="text-gray-400">
          <span className="font-semibold text-blue-400">Clique para selecionar uma pasta</span>
        </p>
        <p className="text-xs text-gray-500">A pasta deve conter arquivos de solução HRC extraídos</p>
      </label>
    </div>
  );
};
