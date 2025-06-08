import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, shareQuote } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import VerticalQuoteSwiper from "@/components/VerticalQuoteSwiper";

interface DailyQuotesScreenProps {
  userId: number;
  onQuoteIndexChange?: (isFirstQuote: boolean) => void;
}

const DailyQuotesScreen: React.FC<DailyQuotesScreenProps> = ({ 
  userId,
  onQuoteIndexChange 
}) => {
  const queryClient = useQueryClient();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: userQuotes } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  const saveQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/quotes`, {
        quoteId,
        isFavorite: false,
        isMemorized: false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/quotes`] });
    },
  });

  const handleIndexChange = (index: number) => {
    setCurrentQuoteIndex(index);
    
    // Notificar al componente padre cuando cambia el índice para controlar la navegación
    if (onQuoteIndexChange) {
      onQuoteIndexChange(index === 0);
    }
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

  // Check loading and empty states
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-lg">Cargando citas...</p>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-lg">No hay citas disponibles</p>
      </div>
    );
  }

  // Renderiza componentes de citas para cada cita disponible
  const renderQuotes = () => {
    return quotes.map((quote, index) => {
      // Obtiene el estado guardado de la cita actual
      const userQuote = Array.isArray(userQuotes) 
        ? userQuotes.find((uq: any) => uq.quoteId === quote.id)
        : undefined;
      const isSaved = !!userQuote;

      // Crea un componente de cita
      return (
        <div key={quote.id} className="flex items-center justify-center h-full w-full px-5">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 w-full">
            <p className="font-quote text-2xl leading-relaxed mb-6 text-gray-800">"{quote.text}"</p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-quote text-lg text-gray-600">— {quote.author}</p>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full inline-block mt-1", 
                  getCategoryColor(quote.category)
                )}>
                  {quote.category}
                </span>
              </div>
              
              <div className="flex space-x-4">
                <button
                  className="text-gray-600 hover:text-primary transition-colors"
                  onClick={() => {
                    if (!isSaved) {
                      saveQuoteMutation.mutate(quote.id);
                    }
                  }}
                  disabled={saveQuoteMutation.isPending || isSaved}
                >
                  <Bookmark className={cn(
                    "h-5 w-5", 
                    isSaved ? "fill-current text-primary" : ""
                  )} />
                </button>
                
                <button
                  className="text-gray-600 hover:text-primary transition-colors"
                  onClick={() => shareQuote(quote)}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 overflow-hidden transition-colors duration-300">
      {/* Minimal header - sticky para mantenerlo dentro del contenedor */}
      <div className="sticky top-0 py-2 z-20 pointer-events-none">
        <div className="flex justify-center">
          <h1 className="text-xs font-heading text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full shadow-sm pointer-events-auto backdrop-blur-sm">
            Citas del Día
          </h1>
        </div>
      </div>
      
      {/* Vertical swiper con transiciones fluidas - ocupa el espacio restante */}
      <div className="flex-1 relative">
        <VerticalQuoteSwiper 
          initialIndex={currentQuoteIndex}
          onIndexChange={handleIndexChange}
        >
          {renderQuotes()}
        </VerticalQuoteSwiper>
      </div>
    </div>
  );
};

export default DailyQuotesScreen;
