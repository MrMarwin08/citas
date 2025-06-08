import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import QuoteCard from "@/components/QuoteCard";
import CollectionCard from "@/components/CollectionCard";
import CreateCollectionDialog from "@/components/CreateCollectionDialog";
import EditCollectionDialog from "@/components/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserQuote, availableTopics } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LibraryScreenProps {
  userId: number;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ userId }) => {
  const [filter, setFilter] = useState<"all" | "favorites" | "memorized" | "collections">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [, setLocation] = useLocation();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle URL parameters for tab state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['all', 'favorites', 'memorized', 'collections'].includes(tabParam)) {
      setFilter(tabParam as any);
    }
  }, []);

  // Refresh collections data when switching to collections tab
  useEffect(() => {
    if (filter === 'collections') {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
    }
  }, [filter, queryClient, userId]);

  const { data: userQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/collections`],
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; thumbnailUrl?: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/collections`, {
        ...data,
        userId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
      toast({
        title: "Colección creada",
        description: "Tu nueva colección se ha creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la colección. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}/collections/${collectionId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
      toast({
        title: "Colección eliminada",
        description: "La colección ha sido eliminada permanentemente",
      });
      // Block interactions temporarily after deletion
      setIsInteractionBlocked(true);
      setTimeout(() => {
        setIsInteractionBlocked(false);
      }, 1000); // 1 second delay
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la colección. Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Block interactions temporarily even on error
      setIsInteractionBlocked(true);
      setTimeout(() => {
        setIsInteractionBlocked(false);
      }, 1000);
    },
  });

  // Edit collection mutation
  const editCollectionMutation = useMutation({
    mutationFn: async (data: { collectionId: number; name: string; thumbnailUrl?: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/collections/${data.collectionId}`, {
        name: data.name,
        thumbnailUrl: data.thumbnailUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/collections`] });
      setIsEditDialogOpen(false);
      setEditingCollection(null);
      toast({
        title: "Colección actualizada",
        description: "La colección ha sido actualizada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la colección. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleCollectionClick = (collectionId: number) => {
    if (isInteractionBlocked) return;
    setLocation(`/collections/${collectionId}`);
  };

  const handleEditCollection = (collection: any) => {
    setEditingCollection(collection);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCollection = (data: { name: string; thumbnailUrl?: string }) => {
    if (editingCollection) {
      editCollectionMutation.mutate({
        collectionId: editingCollection.id,
        name: data.name,
        thumbnailUrl: data.thumbnailUrl,
      });
    }
  };

  const filteredQuotes = React.useMemo(() => {
    if (!userQuotes || filter === "collections") return [];

    let quotes = userQuotes as UserQuote[];

    // Apply status filter
    if (filter === "favorites") {
      quotes = quotes.filter((uq) => uq.isFavorite);
    } else if (filter === "memorized") {
      quotes = quotes.filter((uq) => uq.isMemorized);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      quotes = quotes.filter((uq) => uq.quote.category === categoryFilter);
    }

    return quotes;
  }, [userQuotes, filter, categoryFilter]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#111827' }}>
      {/* Header section - fixed height */}
      <div className="flex-shrink-0 px-5 pt-2 pb-2">
        <h1 className="text-3xl font-heading font-bold text-white mb-4">Mi Biblioteca</h1>

        {/* Single row of tabs: Todas, Favoritas, Memorizadas, Colecciones */}
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
          className="mb-4"
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs px-2">Todas</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs px-2">Favoritas</TabsTrigger>
            <TabsTrigger value="memorized" className="text-xs px-2">Memorizadas</TabsTrigger>
            <TabsTrigger value="collections" className="text-xs px-2">Colecciones</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Categories filter chips - only show for quote tabs */}
        {filter !== "collections" && (
          <div className="overflow-x-auto pb-2 mb-2">
            <div className="flex gap-2 min-w-max">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                className="rounded-full text-sm px-3 py-1 h-auto flex-shrink-0"
                onClick={() => setCategoryFilter("all")}
              >
                Todos
              </Button>
              
              {availableTopics.map((topic) => (
                <Button
                  key={topic}
                  variant={categoryFilter === topic ? "default" : "outline"}
                  className="rounded-full text-sm px-3 py-1 h-auto flex-shrink-0"
                  onClick={() => setCategoryFilter(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-20">
        {filter === "collections" ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Create new collection card */}
            <CollectionCard
              isCreateNew={true}
              onClick={() => setIsCreateDialogOpen(true)}
            />
            
            {collectionsLoading ? (
              <div className="col-span-2 text-center py-4">
                <p>Cargando colecciones...</p>
              </div>
            ) : collections && Array.isArray(collections) && collections.length > 0 ? (
              collections.map((collection: any) => (
                <CollectionCard
                  key={collection.id}
                  collection={{
                    ...collection,
                    quoteCount: collection.quoteCount || 0,
                  }}
                  onClick={() => handleCollectionClick(collection.id)}
                  onEdit={() => handleEditCollection(collection)}
                  onDelete={() => deleteCollectionMutation.mutate(collection.id)}
                  className={isInteractionBlocked ? "pointer-events-none opacity-50" : ""}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-gray-500">No tienes colecciones</p>
                <p className="text-sm text-gray-400 mt-2">
                  Crea tu primera colección para organizar tus citas
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {quotesLoading ? (
              <p className="text-center py-4">Cargando citas guardadas...</p>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tienes citas guardadas</p>
                <p className="text-sm text-gray-400 mt-2">
                  Guarda citas desde la sección "Citas del Día"
                </p>
              </div>
            ) : (
              filteredQuotes.map((userQuote, index) => (
                <QuoteCard
                  key={userQuote.id}
                  quote={userQuote.quote}
                  userId={userId}
                  isSaved={true}
                  isFavorite={userQuote.isFavorite}
                  isMemorized={userQuote.isMemorized}
                  variant="compact"
                  currentTab={filter}
                  position={index + 1}
                  totalQuotes={filteredQuotes.length}
                  showReorderControls={true}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Collection Dialog */}
      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateCollection={(data) => createCollectionMutation.mutate(data)}
      />

      {/* Edit Collection Dialog */}
      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={editingCollection}
        onUpdateCollection={handleUpdateCollection}
      />
    </div>
  );
};

export default LibraryScreen;
