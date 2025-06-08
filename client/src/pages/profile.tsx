import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { User, defaultUser, availableTopics, availableAuthors, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Clock, Moon, Languages, User as UserIcon } from "lucide-react";
import TimePickerDialog from "@/components/TimePickerDialog";
import LanguageSelector from "@/components/LanguageSelector";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import EditUserNameDialog from "@/components/EditUserNameDialog";
import { useToast } from "@/hooks/use-toast";

interface ProfileScreenProps {
  userId: number;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User>(defaultUser);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Cargar datos del usuario
  const { data: userData, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    onSuccess: (data) => {
      if (data) {
        setUser(data);
      }
    },
  });

  // Actualizar el estado cuando los datos se cargan
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Mutación para actualizar las preferencias del usuario
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: User["preferences"]) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/preferences`, preferences);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      setUser(prevUser => ({
        ...prevUser,
        preferences: {
          ...prevUser.preferences,
          ...updatedUser.preferences
        }
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias han sido actualizadas correctamente."
      });
    }
  });

  // Mutación para actualizar la información básica del usuario
  const updateUserMutation = useMutation({
    mutationFn: async (userData: { fullName?: string; profilePicture?: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, userData);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      setUser(prevUser => ({
        ...prevUser,
        ...updatedUser
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Perfil actualizado",
        description: "Tu información de perfil ha sido actualizada correctamente."
      });
    }
  });

  const handleTopicToggle = (topic: string) => {
    const currentTopics = user.preferences?.topics || [];
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter(t => t !== topic)
      : [...currentTopics, topic];
    
    updatePreferencesMutation.mutate({
      ...user.preferences,
      topics: newTopics
    });
  };

  const handleAuthorToggle = (author: string) => {
    const currentAuthors = user.preferences?.authors || [];
    const newAuthors = currentAuthors.includes(author)
      ? currentAuthors.filter(a => a !== author)
      : [...currentAuthors, author];
    
    updatePreferencesMutation.mutate({
      ...user.preferences,
      authors: newAuthors
    });
  };

  const handleDarkModeToggle = () => {
    updatePreferencesMutation.mutate({
      ...user.preferences,
      darkMode: !user.preferences?.darkMode
    });
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleTimeChange = (time: string) => {
    updatePreferencesMutation.mutate({
      ...user.preferences,
      notificationTime: time
    });
  };

  const handleLanguageChange = (language: string) => {
    updatePreferencesMutation.mutate({
      ...user.preferences,
      language
    });
  };

  const handleNameChange = (fullName: string) => {
    updateUserMutation.mutate({ fullName });
  };

  const handleProfileImageChange = (profilePicture: string) => {
    updateUserMutation.mutate({ profilePicture });
  };

  // Si está cargando, muestra un estado de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5">
      <h1 className="text-3xl font-heading font-bold mb-6">Mi Perfil</h1>
      
      {/* User info */}
      <div className="flex items-center mb-8">
        <div className="relative mr-4">
          <img 
            src={user.profilePicture || "https://via.placeholder.com/150"}
            alt="Avatar de usuario" 
            className="w-20 h-20 rounded-full object-cover border-2 border-primary" 
          />
          <ProfileImageUploader 
            currentImage={user.profilePicture || undefined} 
            onImageChange={handleProfileImageChange}
          />
        </div>
        <div>
          <div className="flex items-center">
            <h2 className="font-medium text-lg">{user.fullName || "Usuario"}</h2>
            <EditUserNameDialog 
              currentName={user.fullName} 
              onUpdate={handleNameChange}
            />
          </div>
          <p className="text-gray-500 text-sm">
            Miembro desde {formatDate(user.memberSince)}
          </p>
          <p className="text-gray-500 text-sm flex items-center mt-1">
            <UserIcon className="h-3.5 w-3.5 mr-1" />
            {user.username}
          </p>
        </div>
      </div>
      
      {/* Preferences section */}
      <ScrollArea className="flex-1 pr-2">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Temas de interés</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableTopics.map(topic => (
              <Button
                key={topic}
                variant={user.preferences?.topics?.includes(topic) ? "default" : "outline"}
                className="rounded-full text-sm px-3 py-1 h-auto"
                onClick={() => handleTopicToggle(topic)}
              >
                {topic}
              </Button>
            ))}
          </div>
          
          <h2 className="text-lg font-medium mb-3">Autores favoritos</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableAuthors.map(author => (
              <Button
                key={author}
                variant={user.preferences?.authors?.includes(author) ? "secondary" : "outline"}
                className="rounded-full text-sm px-3 py-1 h-auto"
                onClick={() => handleAuthorToggle(author)}
              >
                {author}
              </Button>
            ))}
          </div>
        </div>
        
        {/* App settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium mb-2">Configuración</h2>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Bell className="text-gray-500 mr-3 h-5 w-5" />
              <Label htmlFor="notifications">Notificaciones diarias</Label>
            </div>
            <Switch 
              id="notifications" 
              checked={notificationsEnabled} 
              onCheckedChange={handleNotificationsToggle}
            />
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="text-gray-500 mr-3 h-5 w-5" />
              <span>Horario de notificación</span>
            </div>
            <TimePickerDialog 
              value={user.preferences?.notificationTime || "08:00"}
              onChange={handleTimeChange}
            />
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Moon className="text-gray-500 mr-3 h-5 w-5" />
              <Label htmlFor="dark-mode">Modo oscuro</Label>
            </div>
            <Switch 
              id="dark-mode" 
              checked={user.preferences?.darkMode || false}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center">
              <Languages className="text-gray-500 mr-3 h-5 w-5" />
              <span>Idioma</span>
            </div>
            <LanguageSelector 
              value={user.preferences?.language || "es"} 
              onChange={handleLanguageChange}
            />
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* App version */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Citas del Alma v1.0.2
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfileScreen;
