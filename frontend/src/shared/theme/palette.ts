import type { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#C45C26',
    light: '#E07A45',
    dark: '#9A4518',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#2D6A4F',
    light: '#40916C',
    dark: '#1B4332',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F7F4F0',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#5C5C5C',
  },
  divider: '#E8E2DA',
  error: {
    main: '#D32F2F',
  },
  warning: {
    main: '#ED6C02',
  },
  info: {
    main: '#0288D1',
  },
  success: {
    main: '#2E7D32',
  },
};
