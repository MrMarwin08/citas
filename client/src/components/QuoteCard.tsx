import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Star, Share2, Brain, Trash2 } from "lucide-react";
import { cn, type Quote } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import QuoteReorderControls from "./QuoteReorderControls";

interface QuoteCardProps {
  quote: Quote;
  userId: number;
  isSaved?: boolean;
  isFavorite?: boolean;
  isMemorized?: boolean;
  variant?: "default" | "compact" | "with-image";
  className?: string;
  currentTab?: "all" | "favorites" | "memorized";
  hideDeleteButton?: boolean;
  customRemoveButton?: {
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  };
  // Advanced reordering props
  position?: number;
  totalQuotes?: number;
  collectionId?: number;
  showReorderControls?: boolean;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  userId,
  isSaved = false,
  isFavorite = false,
  isMemorized = false,
  variant = "default",
  className,
  currentTab = "all",
  hideDeleteButton = false,
  customRemoveButton,
  position,
  totalQuotes,
  collectionId,
  showReorderControls = false,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const autoScrollRef = React.useRef<NodeJS.Timeout | null>(null);

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/users/${userId}/quotes`, {
        quoteId: quote.id,
        isFavorite: false,
        isMemorized: false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/users/${userId}/quotes/${quote.id}/favorite`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const toggleMemorizedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/users/${userId}/quotes/${quote.id}/memorize`,
        {}
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async () => {
      let endpoint = `/api/users/${userId}/quotes/${quote.id}`;
      
      if (currentTab === "favorites") {
        endpoint = `/api/users/${userId}/quotes/${quote.id}/favorites`;
      } else if (currentTab === "memorized") {
        endpoint = `/api/users/${userId}/quotes/${quote.id}/memorized`;
      }
      
      const res = await apiRequest("DELETE", endpoint, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
      toast({
        title: currentTab === "all" ? "Cita eliminada" : "Cita removida",
        description: currentTab === "all" 
          ? "La cita ha sido eliminada permanentemente" 
          : `La cita ha sido removida de ${currentTab === "favorites" ? "favoritas" : "memorizadas"}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Reorder mutation for drag functionality
  const reorderMutation = useMutation({
    mutationFn: async (newPosition: number) => {
      const url = userId 
        ? `/api/users/${userId}/quotes/${quote.id}/reorder`
        : `/api/collections/${collectionId}/quotes/${quote.id}/reorder`;
      
      const body = userId 
        ? { newPosition, filter: currentTab }
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
      setIsDragging(false);
      setDragOffset(0);
      setInsertionIndex(null);
    },
    onError: (error) => {
      console.error("Error reordering quote:", error);
      toast({
        title: "Error",
        description: "No se pudo reordenar la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setIsDragging(false);
      setDragOffset(0);
      setInsertionIndex(null);
    },
  });

  // Enhanced drag functionality with precise tracking and visual feedback
  React.useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || !showReorderControls) return;

    const handleQuoteDragStart = (e: CustomEvent) => {
      setIsDragging(true);
      setDragStartY(e.detail.startY);
      setDragOffset(0);
      setInsertionIndex(null);

      // Prevent scrolling during drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      // Get all quote cards for calculating insertion position
      const allCards = document.querySelectorAll('.quote-card-container');
      const cardHeight = cardElement.getBoundingClientRect().height;

      const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
        moveEvent.preventDefault();
        const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        const offset = currentY - dragStartY;
        setDragOffset(offset);
        
        // Calculate insertion position based on precise drag position
        const draggedCardRect = cardElement.getBoundingClientRect();
        const currentCenterY = draggedCardRect.top + offset + (cardHeight / 2);
        
        // Find insertion index based on cursor position
        let newInsertionIndex = position ? position - 1 : 0;
        allCards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const cardCenterY = rect.top + (rect.height / 2);
          
          if (currentCenterY > cardCenterY && index >= (position ? position - 1 : 0)) {
            newInsertionIndex = index + 1;
          } else if (currentCenterY < cardCenterY && index < (position ? position - 1 : 0)) {
            newInsertionIndex = index;
          }
        });
        
        setInsertionIndex(Math.max(0, Math.min(newInsertionIndex, (totalQuotes || 1) - 1)));
        
        // Auto-scroll functionality
        const viewportHeight = window.innerHeight;
        const scrollThreshold = 100; // Distance from edge to trigger scroll
        
        if (currentY < scrollThreshold) {
          // Scroll up
          if (!autoScrolling) {
            setAutoScrolling(true);
            autoScrollRef.current = setInterval(() => {
              window.scrollBy(0, -10);
            }, 16);
          }
        } else if (currentY > viewportHeight - scrollThreshold) {
          // Scroll down
          if (!autoScrolling) {
            setAutoScrolling(true);
            autoScrollRef.current = setInterval(() => {
              window.scrollBy(0, 10);
            }, 16);
          }
        } else {
          // Stop auto-scrolling
          if (autoScrolling) {
            setAutoScrolling(false);
            if (autoScrollRef.current) {
              clearInterval(autoScrollRef.current);
              autoScrollRef.current = null;
            }
          }
        }
      };

      const handleEnd = () => {
        // Stop auto-scrolling
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current);
          autoScrollRef.current = null;
        }
        setAutoScrolling(false);
        
        // Restore scrolling
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // Calculate new position based on insertion index
        if (insertionIndex !== null && insertionIndex !== (position ? position - 1 : 0)) {
          const newPosition = insertionIndex + 1;
          if (newPosition !== position) {
            reorderMutation.mutate(newPosition);
            return; // Don't reset drag state here, let mutation handle it
          }
        }
        
        // Reset drag state if no valid reorder
        setIsDragging(false);
        setDragOffset(0);
        setInsertionIndex(null);
        
        // Remove event listeners
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('mouseup', handleEnd);
      };

      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('mouseup', handleEnd);
    };

    cardElement.addEventListener('quoteDragStart', handleQuoteDragStart as EventListener);
    
    return () => {
      cardElement.removeEventListener('quoteDragStart', handleQuoteDragStart as EventListener);
      // Cleanup in case component unmounts during drag
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, [isDragging, dragStartY, dragOffset, position, totalQuotes, reorderMutation, insertionIndex, autoScrolling]);

  const handleSave = () => {
    if (!isSaved) {
      saveQuoteMutation.mutate();
    }
  };

  const handleFavorite = () => {
    toggleFavoriteMutation.mutate();
  };

  const handleMemorize = () => {
    toggleMemorizedMutation.mutate();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Cita de ${quote.author}`,
          text: `"${quote.text}" — ${quote.author}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `"${quote.text}" — ${quote.author}`;
      navigator.clipboard.writeText(shareText).then(
        () => {
          alert("Cita copiada al portapapeles");
        },
        () => {
          alert("No se pudo copiar la cita");
        }
      );
    }
  };

  const handleDelete = () => {
    if (currentTab === "all") {
      // Show confirmation dialog for permanent deletion
      setShowDeleteDialog(true);
    } else {
      // For favorites and memorized, delete without confirmation
      deleteQuoteMutation.mutate();
    }
  };

  const confirmDelete = () => {
    deleteQuoteMutation.mutate();
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      Motivación: "bg-yellow-100 text-yellow-800",
      Filosofía: "bg-blue-100 text-blue-800",
      Reflexión: "bg-green-100 text-green-800",
      Mindfulness: "bg-purple-100 text-purple-800",
      Amor: "bg-pink-100 text-pink-800",
      Religión: "bg-indigo-100 text-indigo-800",
      Superación: "bg-orange-100 text-orange-800",
      Éxito: "bg-teal-100 text-teal-800",
    };

    return categoryColors[category] || "bg-primary/10 text-primary";
  };

  if (variant === "with-image" && quote.backgroundImageUrl) {
    return (
      <div className={cn("relative h-60 rounded-xl overflow-hidden shadow-lg", className)}>
        <img
          src={quote.backgroundImageUrl}
          alt={`Quote by ${quote.author}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white font-quote text-xl font-medium mb-2">"{quote.text}"</p>
          <p className="text-white/80 font-quote text-sm">— {quote.author}</p>
        </div>
      </div>
    );
  }

  // Structure: Controls + Quote Card in horizontal layout
  if (showReorderControls && position && totalQuotes) {
    return (
      <div 
        ref={cardRef}
        className={cn(
          "quote-card-container flex items-center gap-2 transition-all duration-200",
          isDragging && "z-50 shadow-2xl scale-105 opacity-90",
          // Add spacing effect when this card is at insertion point
          insertionIndex !== null && position && insertionIndex === position - 1 && !isDragging && "mb-8",
          className
        )}
        style={{
          transform: isDragging ? `translateY(${dragOffset}px)` : 'none',
          zIndex: isDragging ? 1000 : 'auto',
          transition: isDragging ? 'none' : 'all 0.3s ease',
          marginLeft: '4px',
          marginRight: '4px',
          paddingLeft: '4px',
          paddingRight: '4px',
        }}
      >
        {/* Reordering Controls - Adjacent to card */}
        <div className="flex-shrink-0">
          <QuoteReorderControls
            quoteId={quote.id}
            currentPosition={position}
            totalQuotes={totalQuotes}
            userId={collectionId ? undefined : userId}
            collectionId={collectionId}
            filter={currentTab}
            className="relative"
          />
        </div>

        {/* Quote Card - Expanded width */}
        <div className="flex-1 relative">
          {/* Insertion Guide - Shows where quote will be dropped */}
          {insertionIndex !== null && position && insertionIndex === position - 1 && !isDragging && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 shadow-lg animate-pulse -mt-1 z-50" />
          )}

          <Card className={cn("overflow-hidden transition-transform hover:shadow-md w-full")}>
            {variant === "default" && quote.backgroundImageUrl && (
              <div className="w-full h-40 overflow-hidden">
                <img
                  src={quote.backgroundImageUrl}
                  alt={`Quote by ${quote.author}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className={cn("p-5", variant === "compact" ? "pt-5" : "pt-5")}>
              <div className="w-full">
                <p className="font-quote text-lg mb-2">"{quote.text}"</p>
                <p className="font-quote text-sm text-gray-600 mb-3">— {quote.author}</p>
                <div className="flex justify-between items-center">
                  <span className={cn("text-xs px-2 py-1 rounded-full", getCategoryColor(quote.category))}>
                    {quote.category}
                  </span>
                  <div className="flex gap-3">
                    {variant !== "compact" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          isSaved ? "text-primary" : "text-gray-400"
                        )}
                        onClick={handleSave}
                        disabled={saveQuoteMutation.isPending}
                      >
                        <Bookmark className={cn("h-5 w-5", isSaved ? "fill-current" : "")} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        isFavorite ? "text-yellow-500" : "text-gray-400"
                      )}
                      onClick={handleFavorite}
                      disabled={toggleFavoriteMutation.isPending}
                    >
                      <Star className={cn("h-5 w-5", isFavorite ? "fill-current" : "")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        isMemorized ? "text-purple-500" : "text-gray-400"
                      )}
                      onClick={handleMemorize}
                      disabled={toggleMemorizedMutation.isPending}
                    >
                      <Brain className={cn("h-5 w-5", isMemorized ? "fill-current" : "")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400"
                      onClick={handleShare}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                    
                    {/* Custom remove button (for collections) or regular delete button */}
                    {customRemoveButton ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={customRemoveButton.onClick}
                        disabled={customRemoveButton.disabled}
                        title={customRemoveButton.title || "Quitar de la colección"}
                      >
                        ✕
                      </Button>
                    ) : isSaved && !hideDeleteButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={deleteQuoteMutation.isPending}
                        title={currentTab === "all" ? "Eliminar permanentemente" : 
                               currentTab === "favorites" ? "Quitar de favoritas" : 
                               "Quitar de memorizadas"}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Delete confirmation dialog */}
          <DeleteConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={confirmDelete}
            title="¿Eliminar cita permanentemente?"
            description="Esta acción no se puede deshacer. La cita será eliminada completamente de tu biblioteca."
            confirmText="Eliminar"
            cancelText="Cancelar"
            destructive={true}
          />
        </div>
      </div>
    );
  }

  // Default layout without reorder controls
  return (
    <div 
      ref={cardRef}
      className={cn(
        "quote-card-container relative transition-all duration-200",
        isDragging && "z-50 shadow-2xl scale-105 opacity-90",
        className
      )}
      style={{
        transform: isDragging ? `translateY(${dragOffset}px)` : 'none',
        zIndex: isDragging ? 1000 : 'auto',
        transition: isDragging ? 'none' : 'all 0.3s ease',
        marginLeft: '8px',
        marginRight: '8px',
      }}
    >
      <Card className={cn("overflow-hidden transition-transform hover:shadow-md")}>
        {variant === "default" && quote.backgroundImageUrl && (
          <div className="w-full h-40 overflow-hidden">
            <img
              src={quote.backgroundImageUrl}
              alt={`Quote by ${quote.author}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className={cn("p-5", variant === "compact" ? "pt-5" : "pt-5")}>
          <div className="w-full">
            <p className="font-quote text-lg mb-2">"{quote.text}"</p>
            <p className="font-quote text-sm text-gray-600 mb-3">— {quote.author}</p>
            <div className="flex justify-between items-center">
              <span className={cn("text-xs px-2 py-1 rounded-full", getCategoryColor(quote.category))}>
                {quote.category}
              </span>
              <div className="flex gap-3">
                {variant !== "compact" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      isSaved ? "text-primary" : "text-gray-400"
                    )}
                    onClick={handleSave}
                    disabled={saveQuoteMutation.isPending}
                  >
                    <Bookmark className={cn("h-5 w-5", isSaved ? "fill-current" : "")} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isFavorite ? "text-yellow-500" : "text-gray-400"
                  )}
                  onClick={handleFavorite}
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <Star className={cn("h-5 w-5", isFavorite ? "fill-current" : "")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isMemorized ? "text-purple-500" : "text-gray-400"
                  )}
                  onClick={handleMemorize}
                  disabled={toggleMemorizedMutation.isPending}
                >
                  <Brain className={cn("h-5 w-5", isMemorized ? "fill-current" : "")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                
                {/* Custom remove button (for collections) or regular delete button */}
                {customRemoveButton ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={customRemoveButton.onClick}
                    disabled={customRemoveButton.disabled}
                    title={customRemoveButton.title || "Quitar de la colección"}
                  >
                    ✕
                  </Button>
                ) : isSaved && !hideDeleteButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={deleteQuoteMutation.isPending}
                    title={currentTab === "all" ? "Eliminar permanentemente" : 
                           currentTab === "favorites" ? "Quitar de favoritas" : 
                           "Quitar de memorizadas"}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="¿Eliminar cita permanentemente?"
        description="Esta acción no se puede deshacer. La cita será eliminada completamente de tu biblioteca."
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive={true}
      />
    </div>
  );
};

export default QuoteCard;
