import { useAppSelector } from '../store/hooks';
import { translations, TranslationSchema } from '../constants/translations';

export function useTranslation(): TranslationSchema {
  const language = useAppSelector(state => state.settings.language);
  return translations[language] || translations.VI;
}