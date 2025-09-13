import React, { useCallback, useState } from 'react';
import type { UploadedImage } from '../types';
import { UploadIcon, XCircleIcon } from './Icons';

interface UploaderProps {
  onImagesUpload: (images: UploadedImage[]) => void;
  onRemoveImage: (id: string) => void;
  uploadedImages: UploadedImage[];
  isSingle?: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onImagesUpload, onRemoveImage, uploadedImages, isSingle = false }) => {
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
  
  const a11yText = isSingle ? 'Upload one image' : 'Upload one or multiple images'
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">Upload Product Photo(s)</label>
      {uploadedImages.length === 0 ? (
         <label
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`relative flex justify-center items-center w-full h-48 px-6 pt-5 pb-6 border-2 border-dashed border-white/20 rounded-lg cursor-pointer transition-all duration-300 ${isDragging ? 'border-fuchsia-500 bg-fuchsia-500/10 scale-105' : 'hover:border-white/40'}`}
        >
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">{a11yText}</p>
          </div>
          <input id="file-upload" name="file-upload" type="file" multiple={!isSingle} className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
        </label>
      ) : (
        <div className="grid grid-cols-3 gap-3 mt-2 p-3 bg-black/20 rounded-lg">
          {uploadedImages.map((image) => (
            <div key={image.id} className="relative group aspect-square">
              <img src={image.dataUrl} alt={image.file.name} className="w-full h-full object-cover rounded-md" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => onRemoveImage(image.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                    aria-label="Remove image"
                  >
                    <XCircleIcon className="w-8 h-8" />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Uploader;