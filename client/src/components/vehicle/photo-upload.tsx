import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2 } from "lucide-react";

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  existingPhotos?: { filename: string; data: string; contentType: string }[];
  disabled?: boolean;
}

export function PhotoUpload({ onPhotosChange, existingPhotos = [], disabled = false }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Generate preview URLs for the existing photos if provided
  useEffect(() => {
    if (existingPhotos && existingPhotos.length > 0) {
      const urls = existingPhotos.map(photo => {
        return `data:${photo.contentType};base64,${photo.data}`;
      });
      setPreviewUrls(urls);
    }
  }, [existingPhotos]);
  
  // Update parent component when photos change
  useEffect(() => {
    onPhotosChange(photos);
  }, [photos, onPhotosChange]);
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, position: number) => {
    if (e.target.files && e.target.files[0]) {
      const newPhotos = [...photos];
      const file = e.target.files[0];
      newPhotos[position] = file;
      setPhotos(newPhotos);
      
      // Create and store the preview URL
      const newPreviewUrls = [...previewUrls];
      newPreviewUrls[position] = URL.createObjectURL(file);
      setPreviewUrls(newPreviewUrls);
    }
  };
  
  const removePhoto = (position: number) => {
    const newPhotos = [...photos];
    const newPreviewUrls = [...previewUrls];
    
    // Remove the photo and its preview
    newPhotos.splice(position, 1);
    newPreviewUrls.splice(position, 1);
    
    setPhotos(newPhotos);
    setPreviewUrls(newPreviewUrls);
  };
  
  // Define the positions and labels for the four photo spots
  const photoPositions = [
    { label: "Front View", position: 0 },
    { label: "Rear View", position: 1 },
    { label: "Driver Side", position: 2 },
    { label: "Passenger Side", position: 3 }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      {photoPositions.map(({ label, position }) => (
        <div 
          key={position}
          className="border-2 border-dashed border-neutral-300 rounded-md p-4 text-center h-40 flex flex-col items-center justify-center relative"
        >
          {previewUrls[position] ? (
            // Show preview with option to remove
            <div className="h-full w-full relative">
              <img 
                src={previewUrls[position]} 
                alt={label} 
                className="h-full w-full object-cover object-center rounded-sm"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full"
                  onClick={() => removePhoto(position)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            // Show upload option
            <div className="space-y-2 flex flex-col items-center">
              <Camera className="h-6 w-6 text-neutral-400" />
              <p className="text-sm text-neutral-600">{label}</p>
              {!disabled && (
                <div>
                  <input
                    id={`photo-upload-${position}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, position)}
                  />
                  <label htmlFor={`photo-upload-${position}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer" type="button">
                      Upload Photo
                    </Button>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
