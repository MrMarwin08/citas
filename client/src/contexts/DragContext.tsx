import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DragState {
  isDragging: boolean;
  draggedQuoteId: number | null;
  insertionIndex: number | null;
  draggedFromPosition: number | null;
}

interface DragContextType {
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
  startDrag: (quoteId: number, position: number) => void;
  updateInsertion: (index: number) => void;
  endDrag: () => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export const useDragContext = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
};

interface DragProviderProps {
  children: ReactNode;
}

export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedQuoteId: null,
    insertionIndex: null,
    draggedFromPosition: null,
  });

  const startDrag = (quoteId: number, position: number) => {
    setDragState({
      isDragging: true,
      draggedQuoteId: quoteId,
      insertionIndex: null,
      draggedFromPosition: position,
    });
  };

  const updateInsertion = (index: number) => {
    setDragState(prev => ({
      ...prev,
      insertionIndex: index,
    }));
  };

  const endDrag = () => {
    setDragState({
      isDragging: false,
      draggedQuoteId: null,
      insertionIndex: null,
      draggedFromPosition: null,
    });
  };

  return (
    <DragContext.Provider value={{
      dragState,
      setDragState,
      startDrag,
      updateInsertion,
      endDrag,
    }}>
      {children}
    </DragContext.Provider>
  );
};