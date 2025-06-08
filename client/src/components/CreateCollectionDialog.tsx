import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCollection: (data: { name: string; thumbnailUrl?: string }) => void;
}

const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({
  open,
  onOpenChange,
  onCreateCollection,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalThumbnailUrl = 
      imageMethod === "preset" && selectedPreset 
        ? selectedPreset 
        : imageMethod === "url" && thumbnailUrl.trim() 
          ? thumbnailUrl.trim() 
        : imageMethod === "upload" && uploadedImage
          ? uploadedImage
          : undefined;

    onCreateCollection({
      name: name.trim(),
      thumbnailUrl: finalThumbnailUrl,
    });

    // Reset form
    setName("");
    setThumbnailUrl("");
    setSelectedPreset(null);
    setUploadedImage(null);
    setImageMethod("preset");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm mx-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading">Nueva Colección</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Crea una nueva colección para organizar tus citas favoritas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collection name */}
          <div className="space-y-2">
            <Label htmlFor="collection-name" className="text-sm font-medium">
              Nombre de la colección *
            </Label>
            <Input
              id="collection-name"
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
                  {presetThumbnails.map((thumbnail, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedPreset(selectedPreset === thumbnail ? null : thumbnail)}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        selectedPreset === thumbnail
                          ? "border-primary scale-95"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img
                        src={thumbnail}
                        alt={`Opción ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3 mt-3">
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setUploadedImage(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {uploadedImage && (
                    <div className="mt-2 text-center">
                      <img
                        src={uploadedImage}
                        alt="Imagen subida"
                        className="w-20 h-20 rounded-lg object-cover border mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedImage(null)}
                        className="mt-2 text-xs text-red-500 hover:text-red-600"
                      >
                        Quitar imagen
                      </button>
                    </div>
                  )}
                </div>
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
              Crear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;