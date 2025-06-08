import React from "react";
import { cn } from "@/lib/utils";

interface InsertionGuideProps {
  show: boolean;
  insertionIndex: number | null;
  className?: string;
}

const InsertionGuide: React.FC<InsertionGuideProps> = ({
  show,
  insertionIndex,
  className
}) => {
  if (!show || insertionIndex === null) return null;

  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-0.5 bg-blue-500 shadow-lg transition-opacity duration-200",
        "before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2",
        "before:w-2 before:h-2 before:bg-blue-500 before:rounded-full",
        "after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2", 
        "after:w-2 after:h-2 after:bg-blue-500 after:rounded-full",
        "animate-pulse",
        className
      )}
      style={{
        zIndex: 999,
        opacity: show ? 1 : 0,
      }}
    />
  );
};

export default InsertionGuide;