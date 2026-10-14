import { useAppSelector } from '../store/hooks';
import { CYBER_DARK, CYBER_LIGHT, ColorPalette } from '../constants/Colors';

export function useThemeColors(): ColorPalette {
  const theme = useAppSelector(state => state.settings.theme);
  return theme === 'CYBER_LIGHT' ? CYBER_LIGHT : CYBER_DARK;
}