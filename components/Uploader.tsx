import React, { useCallback, useState } from 'react';
import type { UploadedImage } from '../types';
import { UploadIcon, XCircleIcon } from './Icons';

interface UploaderProps {
  onImagesUpload: (images: UploadedImage[]) => void;
  onRemoveImage: (id: string) => void;
  uploadedImages: UploadedImage[];
}

const Uploader: React.FC<UploaderProps> = ({ onImagesUpload, onRemoveImage, uploadedImages }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const filePromises = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => {
        return new Promise<UploadedImage>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const [header, base64] = dataUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
            resolve({
              id: crypto.randomUUID(),
              file,
              dataUrl,
              base64,
              mimeType
            });
          };
          reader.readAsDataURL(file);
        });
      });

    Promise.all(filePromises).then(newImages => {
      onImagesUpload(newImages);
    });
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
    if (e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [handleFileChange]);
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1">Upload Product Photos</label>
      {uploadedImages.length === 0 ? (
         <label
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`flex justify-center items-center w-full h-48 px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-gray-700' : 'hover:border-gray-500'}`}
        >
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Upload one or multiple images</p>
          </div>
          <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
        </label>
      ) : (
        <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-gray-800 rounded-lg">
          {uploadedImages.map((image) => (
            <div key={image.id} className="relative group">
              <img src={image.dataUrl} alt={image.file.name} className="w-full h-20 object-cover rounded-md" />
              <button
                onClick={() => onRemoveImage(image.id)}
                className="absolute -top-2 -right-2 bg-gray-800 rounded-full text-red-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Uploader;
