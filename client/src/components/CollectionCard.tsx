import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Plus, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

interface Collection {
  id: number;
  name: string;
  thumbnailUrl?: string;
  quoteCount?: number;
}

interface CollectionCardProps {
  collection?: Collection;
  isCreateNew?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  isCreateNew = false,
  onClick,
  onDelete,
  onEdit,
  className,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  if (isCreateNew) {
    return (
      <Card
        className={cn(
          "aspect-square cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-colors",
          "flex items-center justify-center bg-gray-50/50 hover:bg-gray-100/50",
          className
        )}
        onClick={onClick}
      >
        <div className="text-center">
          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Nueva Colección</p>
        </div>
      </Card>
    );
  }

  if (!collection) return null;

  return (
    <Card
      className={cn(
        "aspect-square cursor-pointer overflow-hidden hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-full">
        {/* Thumbnail */}
        <div className="h-2/3 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
          {collection.thumbnailUrl ? (
            <img
              src={collection.thumbnailUrl}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {collection.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* Remove the badge counter completely */}
        </div>

        {/* Collection info */}
        <div className="h-1/3 p-3 flex items-center justify-between bg-white">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-800 truncate">
              {collection.name}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {collection.quoteCount === 1 ? "1 cita" : `${collection.quoteCount || 0} citas`}
            </p>
          </div>
          
          <div className="flex gap-1">
            {onEdit && (
              <button 
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-4 h-4 text-blue-500" />
              </button>
            )}
            
            {onDelete && (
              <button 
                className="p-1 hover:bg-red-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          onDelete?.();
          setShowDeleteDialog(false);
        }}
        title="¿Eliminar colección?"
        description="Esta acción eliminará permanentemente la colección y todas las citas asociadas. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive={true}
      />
    </Card>
  );
};

export default CollectionCard;