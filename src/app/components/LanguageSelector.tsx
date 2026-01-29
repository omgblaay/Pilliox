import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface LanguageSelectorProps {
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function LanguageSelector({ variant = 'outline', className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  ];

  // Find current language, default to English if not found
  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={`gap-2 ${className}`}>
          <Languages className="h-4 w-4" />
          <span>{currentLanguage.flag} {currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer gap-2 transition-colors
              ${i18n.language === lang.code 
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}