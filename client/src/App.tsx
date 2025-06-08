import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CollectionDetail from "@/pages/collection-detail";

// Importamos lo necesario para el tema
import { ThemeProvider } from "next-themes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/collections/:id">
        {(params) => <CollectionDetail userId={1} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Añadimos prevención del parpadeo de tema al cargar
  const [mounted, setMounted] = useState(false);

  // Solo después que el componente está montado, renderizamos el contenido
  // Esto evita problemas de hidratación con el tema
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <div className="h-screen w-screen font-sans antialiased transition-colors duration-300 overflow-hidden" style={{ backgroundColor: '#111827' }}>
            <div className="h-full w-full" style={{ backgroundColor: '#111827' }}>
              {mounted && <Router />}
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
