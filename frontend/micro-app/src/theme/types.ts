import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    vars: ThemeVars;
    customShadows: {
      z1: string;
      z4: string;
      z8: string;
      z12: string;
      z16: string;
      z20: string;
      z24: string;
      dialog: string;
      card: string;
      dropdown: string;
      primary: string;
      secondary: string;
      info: string;
      success: string;
      warning: string;
      error: string;
      z1Channel: string;
      z4Channel: string;
      z8Channel: string;
      z12Channel: string;
      z16Channel: string;
      z20Channel: string;
      z24Channel: string;
    };
  }

  interface Palette {
    neutral: PaletteColor;
    common: CommonColors & {
      blackChannel: string;
      whiteChannel: string;
    };
  }
  interface PaletteOptions {
    neutral?: PaletteColorOptions;
  }

  interface PaletteColor {
    lighter: string;
    darker: string;
    lighterChannel: string;
    darkerChannel: string;
    mainChannel: string;
  }
  interface PaletteColorOptions {
    lighter?: string;
    darker?: string;
  }

  interface TypeBackground {
    neutral: string;
    neutralChannel: string;
    defaultChannel: string;
    paperChannel: string;
  }

  interface ThemeVars {
    palette: Palette & {
      grey: Palette['grey'] & {
        [key: string]: string;
      };
    };
    shadows: string[];
    customShadows: Theme['customShadows'];
    shape: Theme['shape'];
    typography: Theme['typography'];
    transitions: Theme['transitions'];
    zIndex: Theme['zIndex'];
  }
  interface ThemeOptions {
    customShadows?: {
      z1?: string;
      z4?: string;
      z8?: string;
      z12?: string;
      z16?: string;
      z20?: string;
      z24?: string;
      dialog?: string;
      card?: string;
      dropdown?: string;
      primary?: string;
      secondary?: string;
      info?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    soft: true;
  }
}

declare module '@mui/material/Badge' {
  interface BadgePropsVariantOverrides {
    online: true;
    alway: true;
    busy: true;
    offline: true;
  }
}
