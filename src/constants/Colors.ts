export interface ColorPalette {
  primary: string;
  background: string;
  surface: string;
  cardBg: string;
  white: string;
  text: string;
  textLight: string;
  danger: string;
  border: string;
  glitchCyan: string;
  glitchMagenta: string;
  inputBg: string;
}

export const CYBER_DARK: ColorPalette = {
  primary: '#00FF98',
  background: '#0D0D0D',
  surface: '#1a1a1a93',
  cardBg: '#141414',
  white: '#FFFFFF',
  text: '#2EFFAA',
  textLight: '#737373',
  danger: '#FF003C',
  border: '#2EFFAA',
  glitchCyan: '#00FFFF',
  glitchMagenta: '#FF00FF',
  inputBg: '#0A0A0A',
};

export const CYBER_LIGHT: ColorPalette = {
  primary: '#00e288',
  background: '#ffffff',
  surface: '#fffdfdd2',
  cardBg: '#f0f0f0',
  white: '#0F172A',
  text: '#008F26',
  textLight: '#475569',
  danger: '#DC2626',
  border: '#008F26',
  glitchCyan: '#51c0f8',
  glitchMagenta: '#A21CAF',
  inputBg: '#f5f5f5',
};

export default CYBER_DARK;