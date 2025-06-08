import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Upload, Link } from "lucide-react";

interface Collection {
  id: number;
  name: string;
  thumbnailUrl?: string;
  quoteCount?: number;
}

interface EditCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection | null;
  onUpdateCollection: (data: { name: string; thumbnailUrl?: string }) => void;
}

const EditCollectionDialog: React.FC<EditCollectionDialogProps> = ({
  open,
  onOpenChange,
  collection,
  onUpdateCollection,
}) => {
  const [name, setName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [imageMethod, setImageMethod] = useState<"url" | "preset" | "upload">("preset");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Predefined thumbnail options
  const presetThumbnails = [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=100&h=100&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=100&h=100&fit=crop&crop=center",
  ];

  // Populate form with existing collection data when dialog opens
  useEffect(() => {
    if (open && collection) {
      setName(collection.name);
      setThumbnailUrl(collection.thumbnailUrl || "");
      setSelectedPreset(collection.thumbnailUrl || null);
      setUploadedImage(null);
      
      // Determine which tab to show based on existing thumbnail
      if (collection.thumbnailUrl) {
        if (presetThumbnails.includes(collection.thumbnailUrl)) {
          setImageMethod("preset");
          setSelectedPreset(collection.thumbnailUrl);
        } else {
          setImageMethod("url");
        }
      } else {
        setImageMethod("preset");
      }
    }
  }, [open, collection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalThumbnailUrl = "";
    
    if (imageMethod === "preset" && selectedPreset) {
      finalThumbnailUrl = selectedPreset;
    } else if (imageMethod === "url" && thumbnailUrl.trim()) {
      finalThumbnailUrl = thumbnailUrl.trim();
    } else if (imageMethod === "upload" && uploadedImage) {
      finalThumbnailUrl = uploadedImage;
    }

    onUpdateCollection({
      name: name.trim(),
      thumbnailUrl: finalThumbnailUrl,
    });

    // Reset form
    setName("");
    setThumbnailUrl("");
    setSelectedPreset(null);
    setUploadedImage(null);
    setImageMethod("preset");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Editar colección</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collection name */}
          <div className="space-y-2">
            <Label htmlFor="edit-collection-name" className="text-sm font-medium">
              Nombre de la colección *
            </Label>
            <Input
              id="edit-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Motivación matutina"
              className="w-full"
              required
            />
          </div>

          {/* Image selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Imagen (opcional)</Label>
            
            <Tabs value={imageMethod} onValueChange={(value) => setImageMethod(value as "url" | "preset" | "upload")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preset" className="text-xs">
                  <Image className="w-3 h-3 mr-1" />
                  Predefinidas
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Subir
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs">
                  <Link className="w-3 h-3 mr-1" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preset" className="space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-2">
                  {presetThumbnails.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPreset === url 
                          ? "border-primary ring-2 ring-primary ring-offset-2" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedPreset(url)}
                    >
                      <img
                        src={url}
                        alt={`Opción ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-2 mt-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-sm"
                />
                {uploadedImage && (
                  <div className="mt-2">
                    <img
                      src={uploadedImage}
                      alt="Imagen subida"
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-2 mt-3">
                <Input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full text-sm"
                />
                {thumbnailUrl && (
                  <div className="mt-2">
                    <img
                      src={thumbnailUrl}
                      alt="Vista previa"
                      className="w-16 h-16 rounded-lg object-cover border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="flex-1"
            >
              Actualizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCollectionDialog;