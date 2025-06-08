import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";

interface TimePickerDialogProps {
  value: string;
  onChange: (time: string) => void;
}

const TimePickerDialog: React.FC<TimePickerDialogProps> = ({ value, onChange }) => {
  const [hours, setHours] = useState(value ? parseInt(value.split(":")[0]) : 8);
  const [minutes, setMinutes] = useState(value ? parseInt(value.split(":")[1]) : 0);
  
  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHours(parseInt(e.target.value));
  };
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMinutes(parseInt(e.target.value));
  };
  
  const handleSave = () => {
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    onChange(`${formattedHours}:${formattedMinutes}`);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto font-normal text-gray-500 hover:bg-transparent hover:text-primary">
          {value || "08:00"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar hora de notificación</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center">
              <label htmlFor="hours" className="text-sm text-gray-500 mb-2">Hora</label>
              <select
                id="hours"
                value={hours}
                onChange={handleHoursChange}
                className="w-16 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div className="text-2xl font-medium">:</div>
            <div className="flex flex-col items-center">
              <label htmlFor="minutes" className="text-sm text-gray-500 mb-2">Minutos</label>
              <select
                id="minutes"
                value={minutes}
                onChange={handleMinutesChange}
                className="w-16 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <Clock className="text-gray-400 mr-2 h-5 w-5" />
            <span className="text-gray-600">
              Recibirás notificaciones diarias a las{' '}
              <span className="font-medium">
                {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
              </span>
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline" className="mr-2">Cancelar</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimePickerDialog;