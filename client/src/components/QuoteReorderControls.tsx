import React, { useState, useRef } from "react";
import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuoteReorderControlsProps {
  quoteId: number;
  currentPosition: number;
  totalQuotes: number;
  userId?: number;
  collectionId?: number;
  filter?: 'all' | 'favorites' | 'memorized';
  onReorderStart?: () => void;
  onReorderEnd?: () => void;
  className?: string;
}

const QuoteReorderControls: React.FC<QuoteReorderControlsProps> = ({
  quoteId,
  currentPosition,
  totalQuotes,
  userId,
  collectionId,
  filter = 'all',
  onReorderStart,
  onReorderEnd,
  className = ""
}) => {
  const [editingPosition, setEditingPosition] = useState(false);
  const [tempPosition, setTempPosition] = useState(currentPosition.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for reordering quotes
  const reorderMutation = useMutation({
    mutationFn: async (newPosition: number) => {
      const url = userId 
        ? `/api/users/${userId}/quotes/${quoteId}/reorder`
        : `/api/collections/${collectionId}/quotes/${quoteId}/reorder`;
      
      const body = userId 
        ? { newPosition, filter }
        : { newPosition };
        
      return await apiRequest("PATCH", url, body);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
      }
      if (collectionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/quotes`] });
      }
      onReorderEnd?.();
    },
    onError: (error) => {
      console.error("Error reordering quote:", error);
      toast({
        title: "Error",
        description: "No se pudo reordenar la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
      onReorderEnd?.();
    },
  });

  const handleMoveUp = () => {
    if (currentPosition > 1) {
      onReorderStart?.();
      reorderMutation.mutate(currentPosition - 1);
    }
  };

  const handleMoveDown = () => {
    if (currentPosition < totalQuotes) {
      onReorderStart?.();
      reorderMutation.mutate(currentPosition + 1);
    }
  };

  const handlePositionEdit = () => {
    setEditingPosition(true);
    setTempPosition(currentPosition.toString());
  };

  const handlePositionSave = () => {
    const newPos = parseInt(tempPosition);
    if (!isNaN(newPos) && newPos >= 1 && newPos <= totalQuotes && newPos !== currentPosition) {
      onReorderStart?.();
      reorderMutation.mutate(newPos);
    }
    setEditingPosition(false);
  };

  const handlePositionCancel = () => {
    setEditingPosition(false);
    setTempPosition(currentPosition.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePositionSave();
    } else if (e.key === 'Escape') {
      handlePositionCancel();
    }
  };

  // Touch/Mouse drag handlers - now triggers parent card drag
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Trigger parent card drag instead of just moving controls
    const cardElement = dragRef.current?.closest('.quote-card-container');
    if (cardElement) {
      // Create a custom event to trigger the parent card's drag functionality
      const dragEvent = new CustomEvent('quoteDragStart', {
        detail: {
          quoteId,
          currentPosition,
          startY: 'touches' in e ? e.touches[0].clientY : e.clientY
        }
      });
      cardElement.dispatchEvent(dragEvent);
    }
    
    onReorderStart?.();
  };

  const isDisabled = reorderMutation.isPending;

  return (
    <div 
      className={`flex flex-col items-center gap-0.5 p-1 bg-gray-900/80 rounded backdrop-blur-sm border border-gray-700/50 shadow-lg ${className}`}
      style={{
        width: '28px',
        transform: isDragging ? `translateY(${dragOffset}px)` : 'none',
        zIndex: isDragging ? 1000 : 10,
        opacity: isDragging ? 0.95 : 0.85,
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }}
    >
      {/* Up Arrow - Compact */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMoveUp}
        disabled={isDisabled || currentPosition === 1}
        className="h-6 w-6 p-0 text-white hover:bg-gray-700 disabled:opacity-30"
      >
        <ChevronUp className="h-3 w-3" />
      </Button>

      {/* Position Number - Minimal */}
      <div className="flex items-center justify-center">
        {editingPosition ? (
          <Input
            type="number"
            value={tempPosition}
            onChange={(e) => setTempPosition(e.target.value)}
            onBlur={handlePositionSave}
            onKeyDown={handleKeyDown}
            className="h-6 w-6 text-xs text-center bg-gray-700 border-gray-600 text-white p-0"
            min={1}
            max={totalQuotes}
            autoFocus
          />
        ) : (
          <button
            onClick={handlePositionEdit}
            disabled={isDisabled}
            className="h-6 w-6 text-xs font-medium text-white bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 disabled:opacity-30 transition-colors flex items-center justify-center"
          >
            {currentPosition}
          </button>
        )}
      </div>

      {/* Down Arrow - Compact */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMoveDown}
        disabled={isDisabled || currentPosition === totalQuotes}
        className="h-6 w-6 p-0 text-white hover:bg-gray-700 disabled:opacity-30"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>

      {/* Drag Handle - Fourth Button */}
      <div
        ref={dragRef}
        onTouchStart={handleDragStart}
        onMouseDown={handleDragStart}
        className="h-6 w-6 cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-3 w-3" />
      </div>
    </div>
  );
};

export default QuoteReorderControls;