import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavigationDotsProps {
  totalScreens: number;
  activeScreen: number;
  onNavigate: (screenIndex: number) => void;
}

const NavigationDots: React.FC<NavigationDotsProps> = ({
  totalScreens,
  activeScreen,
  onNavigate,
}) => {
  // Screen names for aria-labels
  const screenNames = [
    "Biblioteca", 
    "Cita Global", 
    "Citas del Día", 
    "Cita Personalizada", 
    "Perfil"
  ];

  return (
    <div className="navigation-dots flex justify-center pb-0.5">
      <motion.div 
        className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {Array.from({ length: totalScreens }).map((_, index) => (
          <motion.button
            key={index}
            className={cn(
              "rounded-full transition-all duration-200 ease-in-out focus:outline-none",
              activeScreen === index
                ? "w-2.5 h-2.5 bg-primary dark:bg-primary-400"
                : "w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            )}
            onClick={() => onNavigate(index)}
            aria-label={`Ir a ${screenNames[index] || `pantalla ${index + 1}`}`}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default NavigationDots;
