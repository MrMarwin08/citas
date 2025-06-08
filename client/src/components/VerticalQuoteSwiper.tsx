import React, { useState, useEffect } from "react";
import { useVerticalSwiper } from "@/hooks/useVerticalSwiper";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface VerticalQuoteSwiperProps {
  children: React.ReactNode[];
  className?: string;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

const VerticalQuoteSwiper: React.FC<VerticalQuoteSwiperProps> = ({
  children,
  className,
  initialIndex = 0,
  onIndexChange,
}) => {
  const {
    activeScreen,
    containerRef,
    handleNavigate,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isTransitioning,
    direction,
  } = useVerticalSwiper({
    initialScreen: initialIndex,
    totalScreens: children.length,
    onScreenChange: onIndexChange,
  });

  const nextScreen = (direction === 'down') 
    ? activeScreen - 1 
    : (direction === 'up' ? activeScreen + 1 : null);

  useEffect(() => {
    // Disable body scroll when component mounts
    document.body.style.overflow = "hidden";
    return () => {
      // Re-enable body scroll when component unmounts
      document.body.style.overflow = "";
    };
  }, []);

  // Animation variants - ajustado para flujo natural de arriba hacia abajo
  const variants = {
    enter: (direction: 'up' | 'down' | null) => ({
      y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1
    },
    exit: (direction: 'up' | 'down' | null) => ({
      zIndex: 0,
      y: direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0,
      opacity: 0
    }),
  };

  // Flecha de retorno - posicionada responsivamente debajo del contenido
  const renderBackToTopButton = () => {
    if (activeScreen === 0) return null;
    
    return (
      <div className="absolute bottom-[max(12vh,80px)] right-[max(5vw,20px)] z-30">
        <motion.button 
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
          onClick={() => handleNavigate(0)}
          aria-label="Volver a la primera cita"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            minHeight: "2.5rem",
            minWidth: "2.5rem",
          }}
        >
          <ArrowUp className="w-4 h-4 text-primary dark:text-primary-400" />
        </motion.button>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full w-full overflow-hidden bg-background relative touch-pan-y",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={activeScreen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            y: { type: "tween", duration: 0.45, ease: [0.23, 1, 0.32, 1] },
            opacity: { duration: 0.35 }
          }}
          className="absolute inset-0 flex items-center justify-center w-full h-full"
        >
          {children[activeScreen]}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {renderBackToTopButton()}
      </AnimatePresence>
    </div>
  );
};

export default VerticalQuoteSwiper;