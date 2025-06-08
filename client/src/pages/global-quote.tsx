import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "@/lib/utils";
import ExpandableQuoteCard from "@/components/ExpandableQuoteCard";

interface GlobalQuoteScreenProps {
  userId: number;
}

const GlobalQuoteScreen: React.FC<GlobalQuoteScreenProps> = ({ userId }) => {
  // Fetch quote data
  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ["/api/quotes/daily"],
  });

  // Fetch user quotes to check if this quote is saved
  const { data: userQuotes } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  // Check if the quote is already saved
  const isSaved = quote && Array.isArray(userQuotes) 
    ? userQuotes.some((uq: any) => uq.quoteId === quote.id) 
    : false;

  // Contenido detallado para la explicación de la cita global
  const getDetailedContent = (quote: Quote) => {
    // Diferentes ejemplos basados en la categoría de la cita
    const getExamplesByCategory = (category: string) => {
      const examples: Record<string, string> = {
        "Motivación": "Muchas personas exitosas han demostrado la importancia de esta idea. Por ejemplo, Jerry Seinfeld desarrolló una técnica llamada \"No romper la cadena\", donde marcaba en un calendario cada día que escribía comedia. Con el tiempo, la cadena de marcas se volvió tan valiosa que no quería romperla, motivándolo a escribir diariamente. Stephen King escribe 2,000 palabras cada día, sin excepción, lo que le ha permitido publicar más de 60 novelas.",
        "Filosofía": "Esta idea es comparable al concepto de Aristóteles sobre la virtud como hábito. Él sostenía que las virtudes éticas son producto de la costumbre, no nacemos con ellas. Así como los músicos se hacen tocando música y los constructores construyendo, nos volvemos justos realizando actos justos y valientes realizando actos de valentía.",
        "Reflexión": "Esta idea es similar a la metáfora del hielo que no se derrite hasta pasar de 0°C. Tus esfuerzos iniciales para cambiar un hábito pueden parecer infructuosos, pero estás acumulando el calor necesario para eventualmente ver el cambio. No te detengas justo antes del punto de inflexión.",
        "Mindfulness": "La práctica diaria de la atención plena ejemplifica esta idea. Las investigaciones muestran que solo 10 minutos diarios de meditación durante 8 semanas pueden cambiar físicamente partes del cerebro relacionadas con la atención y la regulación emocional.",
        "Amor": "Las relaciones duraderas se construyen a través de pequeñas acciones diarias de amor y respeto, no con grandes gestos ocasionales. Estudios en psicología de relaciones muestran que las parejas felices tienen aproximadamente 20 interacciones positivas por cada interacción negativa.",
        "Éxito": "Darren Hardy, en su libro \"El efecto compuesto\", ilustra cómo pequeñas decisiones diarias, cuando se acumulan, crean diferencias dramáticas en los resultados de la vida. Por ejemplo, ahorrar solo $100 al mes durante 40 años a un interés del 8% resulta en más de $300,000."
      };
      
      return examples[category] || examples["Reflexión"];
    };
    
    return {
      examples: getExamplesByCategory(quote.category),
      practicalTips: [
        "Si quieres leer más, empieza con una página al día.",
        "Si quieres hacer ejercicio, empieza con 5 minutos de estiramientos.",
        "Si quieres aprender algo nuevo, dedica 10 minutos diarios al estudio."
      ],
      conclusion: "Tu vida no cambia cuando haces algo grande una vez. Cambia cuando haces algo pequeño todos los días, sin fallar."
    };
  };

  // Explicación básica de la cita
  const getExplanation = (quote: Quote) => {
    // Diferentes explicaciones según la categoría
    const explanations: Record<string, string> = {
      "Motivación": "Esta frase nos invita a encontrar la motivación internamente, en lugar de esperar estímulos externos. Lo importante es mantener la constancia en nuestras acciones.",
      "Filosofía": "Esta reflexión filosófica nos recuerda que nuestras acciones cotidianas definen quiénes somos, no nuestras intenciones o pensamientos ocasionales.",
      "Reflexión": "Esta cita nos invita a reflexionar sobre cómo nuestros hábitos y decisiones diarias, aparentemente pequeñas, determinan nuestro destino a largo plazo.",
      "Mindfulness": "Esta idea nos recuerda la importancia de estar presentes en cada momento, aceptando que el verdadero crecimiento viene de la práctica constante.",
      "Amor": "Esta reflexión nos muestra que el amor verdadero no son los grandes gestos, sino las pequeñas atenciones constantes que demostramos día a día.",
      "Éxito": "Esta frase nos enseña que el éxito no viene de acciones heroicas ocasionales, sino de la disciplina para hacer lo correcto consistentemente, incluso cuando es difícil."
    };
    
    return explanations[quote.category] || "Esta cita nos invita a reflexionar sobre nuestras acciones diarias y su impacto en nuestra vida a largo plazo.";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>Cargando cita global del día...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>No se pudo cargar la cita global</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-slate-900 overflow-hidden transition-colors duration-300">
      {/* Minimal header - posicionado dentro del contenedor */}
      <div className="sticky top-0 py-2 z-10 pointer-events-none">
        <div className="flex justify-center">
          <h1 className="text-xs font-heading text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full shadow-sm pointer-events-auto backdrop-blur-sm">
            Cita Global del Día
          </h1>
        </div>
      </div>

      {/* Quote container - usando flex-1 para ocupar el espacio disponible */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-3 pb-3 pt-1">
        <ExpandableQuoteCard
          quote={quote}
          userId={userId}
          explanation={getExplanation(quote)}
          detailedContent={getDetailedContent(quote)}
          variant="global"
          isSaved={isSaved}
        />

        {/* Daily Lesson - Tamaño reducido para mejor ajuste */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md p-4 w-full border border-indigo-100 dark:border-indigo-900 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-indigo-600 dark:text-indigo-400 text-sm">💡</span>
            <h2 className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Reflexión del día</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-xs">
            Practica la gratitud consciente tomando un momento para reflexionar sobre algo 
            que te haga feliz hoy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalQuoteScreen;
