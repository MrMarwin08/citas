import React, { useEffect, useState } from "react";
import { useSwiper } from "@/hooks/useSwiper";
import NavigationDots from "@/components/NavigationDots";
import MobileContainer from "@/components/MobileContainer";
import LibraryScreen from "./library";
import GlobalQuoteScreen from "./global-quote";
import DailyQuotesScreen from "./daily-quotes";
import PersonalizedQuoteScreen from "./personalized-quote";
import ProfileScreen from "./profile";
import { defaultUser } from "@/lib/utils";
import { motion } from "framer-motion";

const Home: React.FC = () => {
  // Estado para rastrear si estamos en la primera cita del apartado de scroll
  const [isOnFirstQuote, setIsOnFirstQuote] = useState(true);
  
  const {
    activeScreen,
    containerRef,
    handleNavigate,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleScroll,
  } = useSwiper({
    initialScreen: 0, // Start with Library as the first screen
    totalScreens: 5,
  });

  // Función para navegar condicionalmente entre apartados
  const conditionalNavigate = (index: number) => {
    // Solo permitir navegación si estamos en la primera cita del scroll cuando 
    // estamos en el apartado de citas diarias (índice 2)
    if (activeScreen !== 2 || isOnFirstQuote) {
      handleNavigate(index);
    }
  };

  // Set document title based on active screen
  useEffect(() => {
    const titles = [
      "Mi Biblioteca | Citas del Alma",
      "Cita Global del Día | Citas del Alma",
      "Citas del Día | Citas del Alma",
      "Tu Cita Personalizada | Citas del Alma",
      "Mi Perfil | Citas del Alma",
    ];
    document.title = titles[activeScreen];
  }, [activeScreen]);

  const appContent = (
    <motion.div 
      className="h-screen w-screen flex flex-col bg-background dark:bg-gray-900 text-foreground overflow-hidden transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        ref={containerRef}
        className="swiper-container h-full w-full flex overflow-x-auto scroll-snap-x-mandatory hide-scrollbar"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          msOverflowStyle: "none",
          scrollbarWidth: "none"
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {/* Screen 1: Biblioteca personal */}
        <div className="swiper-slide w-full flex-shrink-0 h-full" style={{ scrollSnapAlign: 'center' }}>
          <LibraryScreen userId={defaultUser.id} />
        </div>

        {/* Screen 2: Cita global + Lección */}
        <div className="swiper-slide w-full flex-shrink-0 h-full" style={{ scrollSnapAlign: 'center' }}>
          <GlobalQuoteScreen userId={defaultUser.id} />
        </div>

        {/* Screen 3: Citas del día (central screen) */}
        <div className="swiper-slide w-full flex-shrink-0 h-full" style={{ scrollSnapAlign: 'center' }}>
          <DailyQuotesScreen 
            userId={defaultUser.id} 
            onQuoteIndexChange={setIsOnFirstQuote}
          />
        </div>

        {/* Screen 4: Cita personalizada */}
        <div className="swiper-slide w-full flex-shrink-0 h-full" style={{ scrollSnapAlign: 'center' }}>
          <PersonalizedQuoteScreen userId={defaultUser.id} />
        </div>

        {/* Screen 5: Perfil y ajustes */}
        <div className="swiper-slide w-full flex-shrink-0 h-full" style={{ scrollSnapAlign: 'center' }}>
          <ProfileScreen userId={defaultUser.id} />
        </div>
      </div>

      {/* Bottom navigation dots - mostrar en todos los apartados excepto en las citas posteriores a la primera */}
      {(activeScreen !== 2 || isOnFirstQuote) && (
        <div className="absolute bottom-6 left-0 right-0 z-50">
          <div className="px-4 py-2">
            <NavigationDots
              totalScreens={5}
              activeScreen={activeScreen}
              onNavigate={conditionalNavigate}
            />
          </div>
        </div>
      )}
    </motion.div>
  );

  // Envolver todo el contenido en el contenedor móvil para mantener proporciones
  return (
    <MobileContainer>
      {appContent}
    </MobileContainer>
  );
};

export default Home;
