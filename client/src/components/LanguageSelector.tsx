import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
  const languages = [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
  ];

  return (
    <Select
      value={value || "es"}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-[140px] bg-transparent border-0 shadow-none p-0 h-auto font-normal text-gray-500 hover:text-primary focus:ring-0">
        <SelectValue placeholder="Seleccionar idioma" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;