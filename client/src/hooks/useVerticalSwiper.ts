import { useState, useRef, useEffect, useCallback } from "react";

interface UseVerticalSwiperOptions {
  initialScreen?: number;
  totalScreens: number;
  threshold?: number;
  onScreenChange?: (screenIndex: number) => void;
}

interface UseVerticalSwiperResult {
  activeScreen: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handleNavigate: (screenIndex: number) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void; 
  handleMouseUp: () => void;
  isTransitioning: boolean;
  direction: 'up' | 'down' | null;
}

export function useVerticalSwiper({
  initialScreen = 0,
  totalScreens,
  threshold = 0.15,
  onScreenChange,
}: UseVerticalSwiperOptions): UseVerticalSwiperResult {
  const [activeScreen, setActiveScreen] = useState(initialScreen);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);
  const screenHeight = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);
  const scrollTimeout = useRef<any>(null);
  const lastWheelTime = useRef<number>(0);
  const wheelBuffer = useRef<number[]>([]);

  // Throttle and average wheel events to provide smoother scrolling
  const processWheelEvent = useCallback((deltaY: number) => {
    const now = Date.now();
    
    // Add to buffer and maintain only last 3 events
    wheelBuffer.current.push(deltaY);
    if (wheelBuffer.current.length > 3) {
      wheelBuffer.current.shift();
    }
    
    // Average the wheel events
    const avgDelta = wheelBuffer.current.reduce((sum, val) => sum + val, 0) / wheelBuffer.current.length;
    
    // Throttle events
    if (now - lastWheelTime.current > 200 && !isTransitioning) {
      lastWheelTime.current = now;

      if (Math.abs(avgDelta) > 10) {
        if (avgDelta > 0 && activeScreen < totalScreens - 1) {
          // Scrolled down - moverse a la siguiente cita
          setDirection('up');
          handleNavigate(activeScreen + 1);
          wheelBuffer.current = [];
        } else if (avgDelta < 0 && activeScreen > 0) {
          // Scrolled up - moverse a la cita anterior
          setDirection('down');
          handleNavigate(activeScreen - 1);
          wheelBuffer.current = [];
        }
      }
    }
  }, [activeScreen, totalScreens, isTransitioning]);

  const handleNavigate = useCallback((screenIndex: number) => {
    if (
      screenIndex < 0 || 
      screenIndex >= totalScreens || 
      isTransitioning ||
      screenIndex === activeScreen
    ) {
      return;
    }

    setIsTransitioning(true);
    setDirection(screenIndex > activeScreen ? 'down' : 'up');
    setActiveScreen(screenIndex);
    onScreenChange?.(screenIndex);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [totalScreens, onScreenChange, isTransitioning, activeScreen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    touchStartY.current = e.touches[0].clientY;
    if (containerRef.current) {
      screenHeight.current = containerRef.current.clientHeight;
    }
  }, [isTransitioning]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null || !containerRef.current || isTransitioning) return;

      const touchCurrentY = e.touches[0].clientY;
      const diffY = touchStartY.current - touchCurrentY;
      const swipeThreshold = screenHeight.current * threshold;

      if (Math.abs(diffY) > swipeThreshold) {
        if (diffY > 0 && activeScreen < totalScreens - 1) {
          // Swiped up, move to next screen (siguiente cita abajo)
          setDirection('up');
          handleNavigate(activeScreen + 1);
        } else if (diffY < 0 && activeScreen > 0) {
          // Swiped down, move to previous screen (cita anterior arriba)
          setDirection('down');
          handleNavigate(activeScreen - 1);
        }
        touchStartY.current = null;
      }
    },
    [activeScreen, totalScreens, handleNavigate, threshold, isTransitioning]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
  }, []);

  // Mouse handling for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isTransitioning) return;
    
    mouseStartY.current = e.clientY;
    if (containerRef.current) {
      screenHeight.current = containerRef.current.clientHeight;
    }
  }, [isTransitioning]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (
        mouseStartY.current === null || 
        !containerRef.current || 
        isTransitioning ||
        !e.buttons // Check if mouse button is pressed
      ) return;

      const mouseCurrentY = e.clientY;
      const diffY = mouseStartY.current - mouseCurrentY;
      const swipeThreshold = screenHeight.current * threshold;

      if (Math.abs(diffY) > swipeThreshold) {
        if (diffY > 0 && activeScreen < totalScreens - 1) {
          // Dragged up, move to next screen
          setDirection('up');  // Moverse hacia arriba visualmente
          handleNavigate(activeScreen + 1);
        } else if (diffY < 0 && activeScreen > 0) {
          // Dragged down, move to previous screen
          setDirection('down');  // Moverse hacia abajo visualmente
          handleNavigate(activeScreen - 1);
        }
        mouseStartY.current = null;
      }
    },
    [activeScreen, totalScreens, handleNavigate, threshold, isTransitioning]
  );

  const handleMouseUp = useCallback(() => {
    mouseStartY.current = null;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      processWheelEvent(e.deltaY);
    },
    [processWheelEvent]
  );

  return {
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
  };
}