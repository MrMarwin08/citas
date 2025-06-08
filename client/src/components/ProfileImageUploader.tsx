import React, { useState } from "react";
import { Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfileImageUploaderProps {
  currentImage: string | undefined | null;
  onImageChange: (imageUrl: string) => void;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ 
  currentImage, 
  onImageChange 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Simulated avatar options
  const avatarOptions = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
    "https://i.pravatar.cc/150?img=6",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    setSelectedImage(avatarUrl);
    setPreviewUrl(avatarUrl);
  };

  const handleSave = () => {
    if (selectedImage) {
      onImageChange(selectedImage);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors">
          <Camera className="h-4 w-4 text-gray-600" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar imagen de perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {previewUrl && (
            <div className="flex justify-center mb-4">
              <div className="relative rounded-full overflow-hidden w-24 h-24 border-2 border-primary">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                <Camera className="mr-2 h-4 w-4" />
                Subir imagen
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">O elige un avatar:</p>
            <div className="grid grid-cols-3 gap-3">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  className={`rounded-full overflow-hidden border-2 transition-all ${
                    previewUrl === avatar
                      ? "border-primary scale-105"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => handleAvatarSelection(avatar)}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button 
              disabled={!selectedImage}
              onClick={handleSave}
            >
              Guardar cambios
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileImageUploader;