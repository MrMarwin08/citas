import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn, type Quote } from "@/lib/utils";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QuoteCard from "@/components/QuoteCard";
import MobileContainer from "@/components/MobileContainer";

interface CollectionDetailProps {
  userId: number;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({ userId }) => {
  const [, params] = useRoute("/collections/:id");
  const [, setLocation] = useLocation();
  const collectionId = Number(params?.id);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<number>>(new Set());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch collection quotes
  const { data: collectionQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: [`/api/collections/${collectionId}/quotes`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!collectionId,
  });

  // Fetch user quotes to get favorite/memorized status
  const { data: userQuotes = [] } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch collection details to get the name
  const { data: collections = [] } = useQuery({
    queryKey: [`/api/users/${userId}/collections`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const currentCollection = Array.isArray(collections) ? 
    collections.find((c: any) => c.id === collectionId) : null;

  // Fetch all user quotes for selection
  const { data: allUserQuotes = [], isLoading: allQuotesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAddDialogOpen,
  });

  // Manage quotes in collection mutation
  const manageQuotesInCollectionMutation = useMutation({
    mutationFn: async (changes: { toAdd: number[], toRemove: number[] }) => {
      const addPromises = changes.toAdd.map(quoteId =>
        apiRequest("POST", `/api/collections/${collectionId}/quotes`, { quoteId })
      );
      const removePromises = changes.toRemove.map(quoteId =>
        apiRequest("DELETE", `/api/collections/${collectionId}/quotes/${quoteId}`, {})
      );
      return Promise.all([...addPromises, ...removePromises]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/quotes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
      setIsAddDialogOpen(false);
      const { toAdd, toRemove } = variables;
      if (toAdd.length > 0 && toRemove.length > 0) {
        toast({
          title: "Colección actualizada",
          description: `Se añadieron ${toAdd.length} citas y se removieron ${toRemove.length} citas`,
        });
      } else if (toAdd.length > 0) {
        toast({
          title: "Citas añadidas",
          description: `Se añadieron ${toAdd.length} citas a la colección`,
        });
      } else if (toRemove.length > 0) {
        toast({
          title: "Citas removidas",
          description: `Se removieron ${toRemove.length} citas de la colección`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las citas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Remove quote from collection mutation
  const removeQuoteFromCollectionMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const res = await apiRequest("DELETE", `/api/collections/${collectionId}/quotes/${quoteId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/quotes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada de la colección",
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

  // Update collection name mutation
  const updateCollectionNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/collections/${collectionId}`, { name: newName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
      setIsEditingName(false);
      toast({
        title: "Nombre actualizado",
        description: "El nombre de la colección ha sido actualizado",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleGoBack = () => {
    setLocation("/?tab=collections");
  };

  const handleTabChange = (tabValue: string) => {
    // Always navigate away from current collection, even if collections tab is already selected
    if (tabValue === "collections") {
      setLocation("/?tab=collections");
    } else {
      setLocation(`/?tab=${tabValue}`);
    }
  };

  const handleCollectionsTabClick = () => {
    // Force navigation to collections overview regardless of current tab state
    setLocation("/?tab=collections");
  };

  const handleAddQuotes = () => {
    // Pre-populate selected quotes with those already in the collection
    if (Array.isArray(collectionQuotes)) {
      const currentQuoteIds = new Set((collectionQuotes as any[]).map(cq => cq.quote.id));
      setSelectedQuotes(currentQuoteIds);
    }
    setIsAddDialogOpen(true);
  };

  const handleQuoteSelection = (quoteId: number) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const handleConfirmAddition = () => {
    // Calculate changes needed
    const currentQuoteIds = Array.isArray(collectionQuotes) ? 
      new Set((collectionQuotes as any[]).map(cq => cq.quote.id)) : 
      new Set();
    
    const selectedQuoteIds = selectedQuotes;
    
    const toAdd = Array.from(selectedQuoteIds).filter(id => !currentQuoteIds.has(id));
    const toRemove = Array.from(currentQuoteIds).filter(id => !selectedQuoteIds.has(id));
    
    if (toAdd.length > 0 || toRemove.length > 0) {
      manageQuotesInCollectionMutation.mutate({ toAdd, toRemove });
    } else {
      setIsAddDialogOpen(false);
    }
  };

  const handleRemoveQuote = (quoteId: number) => {
    removeQuoteFromCollectionMutation.mutate(quoteId);
  };

  const handleEditName = () => {
    setEditingName(currentCollection?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editingName.trim() && editingName !== currentCollection?.name) {
      updateCollectionNameMutation.mutate(editingName.trim());
    } else {
      setIsEditingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  // Show all quotes, but mark those already in collection
  const availableQuotes = Array.isArray(allUserQuotes) ? allUserQuotes : [];

  if (!collectionId) {
    return (
      <MobileContainer className="flex items-center justify-center" style={{ backgroundColor: '#111827' }}>
        <p className="text-white">Colección no encontrada</p>
      </MobileContainer>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#111827' }}>
      {/* Header section - exact alignment with library style with proper top margin */}
      <div className="flex-shrink-0 px-5 pt-6 pb-2">
        {/* Title with back arrow and edit icon - aligned with library header */}
        <div className="flex items-start mb-4" style={{ marginTop: '1px' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="h-auto w-auto mr-3 p-0 text-white hover:bg-white/10 mt-2"
          >
            <ArrowLeft className="h-12 w-12 text-white" strokeWidth={2.5} />
          </Button>
          
          {isEditingName ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="text-3xl font-heading font-bold bg-transparent border-none text-white placeholder-white/70 p-0 h-auto focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <div className="flex items-start">
              <h1 className="text-3xl font-heading font-bold text-white">
                {currentCollection?.name || "Colección"}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditName}
                className="h-auto w-auto ml-2 p-0 text-white hover:bg-white/10 flex items-center justify-center mt-2"
              >
                <Edit className="h-12 w-12" strokeWidth={2.5} />
              </Button>
            </div>
          )}
        </div>

        {/* Tab navigation - exact positioning as library */}
        <Tabs value="collections" onValueChange={handleTabChange} className="mb-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs px-2">Todas</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs px-2">Favoritas</TabsTrigger>
            <TabsTrigger value="memorized" className="text-xs px-2">Memorizadas</TabsTrigger>
            <TabsTrigger 
              value="collections" 
              className="text-xs px-2" 
              onClick={handleCollectionsTabClick}
            >
              Colecciones
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content area - scrollable with proper spacing */}
      <div className="flex-1 overflow-y-auto px-5 pb-20">
        {/* Add quote button - positioned in content area with proper spacing */}
        <div className="mb-4">
          <Card 
            className="cursor-pointer border-2 border-dashed border-white/40 hover:border-white/60 transition-colors backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={handleAddQuotes}
          >
            <CardContent className="p-4 flex items-center justify-center">
              <div className="text-center">
                <Plus className="w-6 h-6 text-white/80 mx-auto mb-1" />
                <p className="text-white font-medium text-sm">Añadir cita</p>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Collection quotes */}
          {quotesLoading ? (
            <div className="text-center py-8">
              <p className="text-white/70">Cargando citas...</p>
            </div>
          ) : !Array.isArray(collectionQuotes) || (collectionQuotes as any[]).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70">Esta colección está vacía</p>
              <p className="text-sm text-white/50 mt-2">
                Añade citas para comenzar a organizar tu contenido
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(collectionQuotes as any[]).map((collectionQuote: any, index: number) => {
                // Find the user quote to get favorite/memorized status
                const userQuote = Array.isArray(userQuotes) ? 
                  (userQuotes as any[]).find(uq => uq.quote.id === collectionQuote.quote.id) : 
                  null;
                
                return (
                  <QuoteCard
                    key={collectionQuote.id}
                    quote={collectionQuote.quote}
                    userId={userId}
                    isSaved={true}
                    isFavorite={userQuote?.isFavorite || false}
                    isMemorized={userQuote?.isMemorized || false}
                    variant="compact"
                    className="mb-4"
                    hideDeleteButton={true}
                    customRemoveButton={{
                      onClick: () => handleRemoveQuote(collectionQuote.quote.id),
                      disabled: removeQuoteFromCollectionMutation.isPending,
                      title: "Quitar de la colección"
                    }}
                    position={index + 1}
                    totalQuotes={collectionQuotes.length}
                    collectionId={collectionId}
                    showReorderControls={true}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Add quotes dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md mx-auto border-white/20" style={{ backgroundColor: '#111827' }}>
            <DialogHeader>
              <DialogTitle className="text-white">Añadir citas a la colección</DialogTitle>
              <DialogDescription className="text-white/80">
                Selecciona las citas que quieres añadir a esta colección. Puedes seleccionar múltiples citas.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[60vh] w-full">
              <div className="space-y-3 pr-4">
                {allQuotesLoading ? (
                  <div className="text-center py-4">
                    <p className="text-white">Cargando citas...</p>
                  </div>
                ) : availableQuotes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white">No hay más citas disponibles</p>
                    <p className="text-sm text-white/70 mt-2">
                      Todas tus citas ya están en esta colección
                    </p>
                  </div>
                ) : (
                  availableQuotes.map((userQuote: any) => (
                    <Card
                      key={userQuote.id}
                      className={cn(
                        "cursor-pointer transition-colors border backdrop-blur-sm",
                        selectedQuotes.has(userQuote.quote.id)
                          ? "border-white"
                          : "border-white/30 hover:border-white/50"
                      )}
                      style={{ 
                        backgroundColor: selectedQuotes.has(userQuote.quote.id) 
                          ? 'rgba(255, 255, 255, 0.2)' 
                          : 'rgba(255, 255, 255, 0.1)' 
                      }}
                      onClick={() => handleQuoteSelection(userQuote.quote.id)}
                    >
                      <CardContent className="p-4 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white line-clamp-3">
                            "{userQuote.quote.text}"
                          </p>
                          <p className="text-xs text-white/70 mt-1">
                            — {userQuote.quote.author}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "ml-3 h-8 w-8 rounded-full flex-shrink-0",
                            selectedQuotes.has(userQuote.quote.id)
                              ? "text-white bg-white/20"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {selectedQuotes.has(userQuote.quote.id) ? "✓" : "+"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:border-white/60"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAddition}
                disabled={selectedQuotes.size === 0 || manageQuotesInCollectionMutation.isPending}
                className="flex-1 bg-white text-blue-600 hover:bg-white/90"
              >
                Guardar {selectedQuotes.size > 0 && `(${selectedQuotes.size})`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default CollectionDetail;