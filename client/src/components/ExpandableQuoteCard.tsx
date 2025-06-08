import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn, Quote, shareQuote } from "@/lib/utils";
import { Bookmark, Share2, ChevronDown, ChevronUp, Star, LightbulbIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface ExpandableQuoteCardProps {
  quote: Quote;
  userId: number;
  explanation?: string;
  detailedContent?: {
    examples?: string;
    practicalTips?: string[];
    conclusion?: string;
  };
  variant?: "global" | "personal";
  isSaved?: boolean;
  onSave?: () => void;
}

const ExpandableQuoteCard: React.FC<ExpandableQuoteCardProps> = ({
  quote,
  userId,
  explanation = "Esta cita nos invita a reflexionar sobre nuestras acciones diarias y su impacto en nuestra vida.",
  detailedContent,
  variant = "global",
  isSaved = false,
  onSave,
}) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      saveQuoteMutation.mutate();
    }
  };

  const getThemeColors = () => {
    return variant === "global" 
      ? {
          lightMode: {
            gradientFrom: "from-indigo-50",
            gradientTo: "to-blue-50",
            cardBg: "bg-white/90 dark:bg-slate-800/90",
            tagBg: "bg-indigo-100 dark:bg-indigo-900",
            tagText: "text-indigo-800 dark:text-indigo-300",
            header: "text-indigo-700 dark:text-indigo-400",
            iconText: "text-indigo-600 dark:text-indigo-400",
            quoteText: "text-gray-800 dark:text-gray-100",
            authorText: "text-gray-600 dark:text-gray-300",
            bodyText: "text-gray-700 dark:text-gray-300",
            iconHover: "hover:text-indigo-600 dark:hover:text-indigo-400",
            borderAccent: "border-indigo-200 dark:border-indigo-800"
          },
          darkMode: {
            // Dark mode specific
          }
        }
      : {
          lightMode: {
            gradientFrom: "from-purple-50",
            gradientTo: "to-pink-50",
            cardBg: "bg-white/90 dark:bg-slate-800/90",
            tagBg: "bg-purple-100 dark:bg-purple-900",
            tagText: "text-purple-800 dark:text-purple-300",
            header: "text-purple-700 dark:text-purple-400",
            iconText: "text-purple-600 dark:text-purple-400",
            quoteText: "text-gray-800 dark:text-gray-100",
            authorText: "text-gray-600 dark:text-gray-300",
            bodyText: "text-gray-700 dark:text-gray-300",
            iconHover: "hover:text-purple-600 dark:hover:text-purple-400",
            borderAccent: "border-purple-200 dark:border-purple-800"
          },
          darkMode: {
            // Dark mode specific
          }
        };
  };

  const colors = getThemeColors().lightMode;

  // Motion variants for subtle animations
  const quoteCardVariants = {
    hover: {
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
      translateY: -2,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.1,
        duration: 0.4
      }
    }
  };

  return (
    <motion.div 
      className={cn(
        "backdrop-blur-sm rounded-xl shadow-md p-6 w-full border transition-all", 
        colors.cardBg,
        colors.borderAccent
      )}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      whileHover="hover"
      whileTap="tap"
    >
      {/* Cita principal destacada */}
      <motion.p 
        className={cn("font-quote text-2xl leading-relaxed mb-4", colors.quoteText)}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        "{quote.text}"
      </motion.p>
      
      <motion.p 
        className={cn("font-quote text-lg mb-4", colors.authorText)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        — {quote.author}
      </motion.p>
      
      {/* Etiqueta de tipo con icono */}
      <div className="mb-5 flex items-center">
        <span className={cn(
          "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1", 
          colors.tagBg, colors.tagText
        )}>
          {variant === "global" ? (
            <>
              <Star className="h-3 w-3" /> Cita Global
            </>
          ) : (
            <>
              <LightbulbIcon className="h-3 w-3" /> Para ti
            </>
          )}
        </span>
      </div>
      
      {/* Explicación clara y breve */}
      <div className={cn("mb-6 border-l-2 pl-3", colors.borderAccent)}>
        <p className={cn("text-sm italic", colors.bodyText)}>{explanation}</p>
      </div>
      
      {/* Desplegable con desarrollo completo */}
      {detailedContent && (
        <Accordion 
          type="single" 
          collapsible 
          className="mb-6"
          onValueChange={(value) => setIsExpanded(!!value)}
        >
          <AccordionItem value="detailed-content" className="border-b-0">
            <AccordionTrigger 
              className={cn(
                "py-2 text-sm font-medium hover:no-underline",
                "group transition-all duration-300"
              )}
            >
              <span className={cn("flex items-center gap-1", colors.header)}>
                <motion.span
                  animate={{ scale: isExpanded ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Desarrollo completo
                </motion.span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                className={cn("pt-3 pb-4 space-y-5 text-sm", colors.bodyText)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                {detailedContent.examples && (
                  <div className="rounded-md p-3 bg-gray-50 dark:bg-slate-900/50">
                    <h4 className="font-medium mb-2">Desarrollo con ejemplos:</h4>
                    <p className="leading-relaxed">{detailedContent.examples}</p>
                  </div>
                )}
                
                {detailedContent.practicalTips && detailedContent.practicalTips.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Ejemplos prácticos para aplicar hoy mismo:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {detailedContent.practicalTips.map((tip, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                          className="leading-relaxed"
                        >
                          {tip}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {detailedContent.conclusion && (
                  <div className={cn("border-l-2 p-3 mt-4", colors.borderAccent)}>
                    <h4 className="font-medium mb-2">Para recordar:</h4>
                    <p className="italic">{detailedContent.conclusion}</p>
                  </div>
                )}
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      
      {/* Acciones */}
      <div className="flex justify-end space-x-4 mt-3">
        <motion.button
          className={cn(
            "text-gray-600 dark:text-gray-400 transition-colors", 
            colors.iconHover
          )}
          onClick={handleSave}
          disabled={saveQuoteMutation.isPending || isSaved}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bookmark className={cn(
            "h-5 w-5", 
            isSaved ? "fill-current text-primary dark:text-primary-400" : ""
          )} />
        </motion.button>
        
        <motion.button
          className={cn(
            "text-gray-600 dark:text-gray-400 transition-colors", 
            colors.iconHover
          )}
          onClick={() => shareQuote(quote)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Share2 className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ExpandableQuoteCard;