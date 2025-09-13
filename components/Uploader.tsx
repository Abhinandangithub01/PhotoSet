
import React, { useCallback, useState } from 'react';
import type { UploadedImage } from '../types';
import { UploadIcon } from './Icons';

interface UploaderProps {
  onImageUpload: (image: UploadedImage) => void;
  uploadedImage: UploadedImage | null;
}

const Uploader: React.FC<UploaderProps> = ({ onImageUpload, uploadedImage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const [header, base64] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
        
        onImageUpload({
          file,
          dataUrl,
          base64,
          mimeType
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1">Upload Product Photo</label>
      <label
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`flex justify-center items-center w-full h-48 px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-gray-700' : 'hover:border-gray-500'}`}
      >
        <div className="space-y-1 text-center">
          {uploadedImage ? (
            <img src={uploadedImage.dataUrl} alt="Product preview" className="mx-auto h-36 object-contain" />
          ) : (
            <>
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
      </label>
    </div>
  );
};

export default Uploader;
