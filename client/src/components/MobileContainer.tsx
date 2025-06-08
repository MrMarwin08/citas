import React, { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className,
  style 
}) => {
  const isMobile = useIsMobile();
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [aspectRatio, setAspectRatio] = useState<"modern" | "classic">("modern");
  
  // Detectar cambios de orientación y dimensiones
  useEffect(() => {
    const handleResize = () => {
      // Determinar orientación
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? "portrait" : "landscape");
      
      // Determinar ratio de aspecto basado en dimensiones de pantalla
      // Esto permite una experiencia óptima en diferentes tipos de dispositivos
      const deviceRatio = window.innerWidth / window.innerHeight;
      setAspectRatio(deviceRatio > 0.5 ? "modern" : "classic");
    };
    
    handleResize(); // Inicializar
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Si es un dispositivo móvil real y está en orientación vertical, renderizar normalmente
  // sin contenedores adicionales que puedan causar problemas de visualización
  if (isMobile && orientation === "portrait") {
    return (
      <div className={cn("h-screen w-screen relative overflow-hidden", className)} style={style}>
        {children}
      </div>
    );
  }

  // Establecer dimensiones basadas en el aspecto ratio determinado
  const getDimensions = () => {
    if (aspectRatio === "modern") {
      // Aspecto 18:9 (2:1) - smartphones modernos
      return {
        height: "95vh",
        width: "calc(95vh/2)", // Proporción 2:1
        maxWidth: "420px",     // Limitar ancho máximo
      };
    } else {
      // Aspecto 16:9 - más clásico
      return {
        height: "95vh",
        width: "calc(95vh/1.778)", // Proporción 16:9
        maxWidth: "450px",        // Limitar ancho máximo
      };
    }
  };

  const dimensions = getDimensions();

  // Si es móvil en horizontal o desktop, mantener proporción móvil con contenedor
  return (
    <div className="h-[100vh] w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-slate-950 overflow-hidden transition-colors duration-300">
      <motion.div 
        className={cn(
          "relative bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300",
          className
        )}
        style={{
          height: dimensions.height,
          width: dimensions.width,
          maxWidth: dimensions.maxWidth,
          // Añadir efecto de smartphone con sombra sutil
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Eliminar el borde negro superior que causa problemas visuales */}
        
        {/* Contenido principal en proporción adecuada - sin padding que pueda recortar contenido */}
        <div className="h-full w-full overflow-hidden">
          {children}
        </div>
      </motion.div>
      
      {/* Indicación sutil en pantallas horizontales */}
      {orientation === "landscape" && (
        <div className="absolute bottom-2 text-center text-xs text-gray-500 dark:text-gray-400 px-3 py-0.5 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full">
          Vista optimizada
        </div>
      )}
    </div>
  );
};

export default MobileContainer;