import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, defaultUser } from "@/lib/utils";
import { Clock } from "lucide-react";
import ExpandableQuoteCard from "@/components/ExpandableQuoteCard";

interface PersonalizedQuoteScreenProps {
  userId: number;
}

const PersonalizedQuoteScreen: React.FC<PersonalizedQuoteScreenProps> = ({ userId }) => {
  // Fetch quote data
  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/quotes/personalized/${userId}`],
  });

  // Fetch user quotes to check if this quote is saved
  const { data: userQuotes } = useQuery({
    queryKey: [`/api/users/${userId}/quotes`],
  });

  // Check if the quote is already saved
  const userQuote = quote && Array.isArray(userQuotes) 
    ? userQuotes.find((uq: any) => uq.quoteId === quote.id) 
    : undefined;
  
  const isSaved = !!userQuote;

  // Generate a countdown time (22 hours from now)
  const getCountdownTime = () => {
    const now = new Date();
    const hours = 22 - now.getHours();
    const minutes = 59 - now.getMinutes();
    const seconds = 59 - now.getSeconds();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Contenido detallado para la explicación de la cita personalizada
  const getDetailedContent = (quote: Quote) => {
    // Personaliza el contenido con base en intereses del usuario y categoría de la cita
    const userTopics = defaultUser.preferences?.topics || [];
    const userInterests = Array.isArray(userTopics) ? userTopics : [];
    
    const getPersonalizedExample = () => {
      const personalExamples: Record<string, string> = {
        "Motivación": "Esta cita es particularmente relevante para ti ahora. Muchas personas que persiguen sus metas experimentan momentos de duda o estancamiento. Por ejemplo, la técnica del escritor James Clear de mejorar el 1% cada día, que describe en su libro 'Hábitos Atómicos', ilustra cómo pequeños cambios diarios llevan a transformaciones impresionantes con el tiempo. Si mejoras solo un 1% cada día durante un año, terminarás 37 veces mejor que cuando empezaste.",
        "Filosofía": "Considerando tu interés en temas filosóficos, esta reflexión conecta con el concepto de 'eudaimonia' o bienestar interior de Aristóteles. Él proponía que el camino a la felicidad no es a través de placeres temporales, sino de vivir virtuosamente y desarrollar nuestro potencial. Es un proceso continuo de decisiones conscientes, no un estado que se alcanza de una vez.",
        "Reflexión": "Esta cita resuena con tu búsqueda de significado personal. El psicólogo Viktor Frankl, tras sobrevivir a campos de concentración, desarrolló la logoterapia basada en que encontrar sentido incluso en las circunstancias más difíciles es fundamental para nuestro bienestar. No son las circunstancias sino cómo respondemos a ellas lo que determina nuestra experiencia de vida.",
        "Mindfulness": "Para alguien interesado en mindfulness como tú, esta cita refleja la esencia de la práctica: la atención al momento presente sin juicio. Jon Kabat-Zinn, creador del programa de Reducción de Estrés Basado en Mindfulness, demuestra con investigaciones que la práctica regular cambia físicamente el cerebro, mejorando áreas relacionadas con la autorregulación y reduciendo la reactividad al estrés.",
        "Éxito": "Esta cita tiene especial relevancia para tu interés en el éxito personal. James Dyson, inventor de la aspiradora sin bolsa, creó 5,126 prototipos fallidos antes de lograr el diseño correcto. Cada fracaso le enseñó algo valioso. No fue un momento de brillantez sino años de persistencia lo que le llevó al éxito que conocemos hoy."
      };
      
      // Encuentra un tema relevante entre los intereses del usuario y la categoría de la cita
      const relevantTopic = userInterests.find(topic => 
        quote.category.toLowerCase().includes(topic.toLowerCase())
      ) || quote.category;
      
      return personalExamples[relevantTopic] || personalExamples["Reflexión"];
    };
    
    return {
      examples: getPersonalizedExample(),
      practicalTips: [
        "Reserva 10 minutos cada mañana para visualizar tus metas y reforzar tu propósito.",
        "Lleva un diario para registrar tus pensamientos y reflexionar sobre tu progreso.",
        "Comparte esta idea con alguien cercano para iniciar una conversación significativa."
      ],
      conclusion: "Las grandes transformaciones comienzan con pequeños pasos conscientemente elegidos. Tu camino es único y cada decisión te acerca más a la persona que eliges ser."
    };
  };

  // Explicación personalizada de la cita
  const getPersonalizedExplanation = (quote: Quote) => {
    // Find user's preferred topics for personalized explanation
    const userTopics = defaultUser.preferences?.topics || [];
    const relevantTopic = Array.isArray(userTopics) ? 
      userTopics.find(topic => 
        quote.category.toLowerCase().includes(topic.toLowerCase())
      ) || quote.category 
      : quote.category;
    
    // Explanations based on user interests and quote category
    return `Esta cita refleja tu interés en ${relevantTopic.toLowerCase()} y ofrece una perspectiva que puede inspirarte en tu situación actual. Invita a reflexionar sobre cómo pequeñas acciones conscientes y consistentes pueden crear grandes transformaciones con el tiempo.`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>Cargando tu cita personalizada...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col h-full p-5 items-center justify-center">
        <p>No se pudo cargar la cita personalizada</p>
      </div>
    );
  }

  // Find user's preferred topics for explanation
  const userTopics = defaultUser.preferences?.topics || [];
  const relevantTopic = Array.isArray(userTopics) ? 
    userTopics.find(topic => 
      quote.category.toLowerCase().includes(topic.toLowerCase())
    ) || quote.category 
    : quote.category;

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-slate-900 overflow-hidden transition-colors duration-300">
      {/* Minimal header - posicionado dentro del contenedor */}
      <div className="sticky top-0 py-2 z-10 pointer-events-none">
        <div className="flex justify-center">
          <h1 className="text-xs font-heading text-purple-700 dark:text-purple-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full shadow-sm pointer-events-auto backdrop-blur-sm">
            Tu Cita Personalizada
          </h1>
        </div>
      </div>

      {/* Quote container - usando flex-1 para ocupar el espacio disponible */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-3 pb-3 pt-1">
        <ExpandableQuoteCard
          quote={quote}
          userId={userId}
          explanation={getPersonalizedExplanation(quote)}
          detailedContent={getDetailedContent(quote)}
          variant="personal"
          isSaved={isSaved}
        />
        
        {/* Why this was selected for you - Tamaño reducido para mejor ajuste */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-md p-4 w-full border border-purple-100 dark:border-purple-900 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-purple-600 dark:text-purple-400 text-sm">
              ✨
            </div>
            <h2 className="text-xs font-medium text-purple-700 dark:text-purple-300">¿Por qué esta cita?</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-xs mb-2">
            Basado en tu interés en {relevantTopic.toLowerCase()}, creemos que esta reflexión 
            resonará contigo hoy.
          </p>
          
          {/* Simple countdown */}
          <div className="flex justify-end items-center text-[10px] text-gray-500 dark:text-gray-400">
            <Clock className="mr-1 h-3 w-3" />
            <span>Nueva cita en {getCountdownTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedQuoteScreen;
