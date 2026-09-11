import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
  type Language,
  SUPPORTED_LANGUAGES,
  getStoredLanguage,
  setStoredLanguage,
} from '../locales/translations';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface LanguageSelectorProps {
  className?: string;
  onLanguageChange?: (lang: Language) => void;
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  onLanguageChange,
  showIcon = true,
}) => {
  const [currentLang, setCurrentLang] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    const handleStorage = () => {
      setCurrentLang(getStoredLanguage());
    };
    window.addEventListener('languagechange', handleStorage);
    return () => window.removeEventListener('languagechange', handleStorage);
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    setCurrentLang(newLang);
    setStoredLanguage(newLang);
    window.dispatchEvent(new Event('languagechange'));

    if (onLanguageChange) {
      onLanguageChange(newLang);
    }

    // Persist to user document if logged in
    const user = auth?.currentUser;
    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          preferredLanguage: newLang,
        });
      } catch {
        // Ignore offline or permission issues during language change
      }
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && <Globe size={16} className="text-gray-400 pointer-events-none" />}
      <select
        value={currentLang}
        onChange={handleChange}
        aria-label="Select platform language"
        className="bg-white/90 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
