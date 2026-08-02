import 'src/global.css';

// ----------------------------------------------------------------------

import { ReactNode } from 'react';

import { CONFIG } from 'src/config-global';
import { dancingScript } from 'src/theme/fonts';
import { primary } from 'src/theme/core/palette';
import { ThemeProvider } from 'src/theme/theme-provider';
import { I18nProvider } from 'src/locales/i18n-provider';
import { getInitColorSchemeScript } from 'src/theme/color-scheme-script';

import { ToastProvider } from 'src/components/toast';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { detectSettings } from 'src/components/settings/server';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/auth-provider';
import ReduxProvider from 'src/store/redux-provider';


// ----------------------------------------------------------------------

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: primary.main,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const settings = CONFIG.isStaticExport ? defaultSettings : await detectSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={dancingScript.variable} suppressHydrationWarning>
        {/* TODO(locale): derive <html lang> from active locale when server-side locale wiring is available. */}
        {getInitColorSchemeScript}

        <AuthProvider>
          <ReduxProvider>
            <SettingsProvider
              settings={settings}
              caches={CONFIG.isStaticExport ? 'localStorage' : 'cookie'}
            >
              <ThemeProvider>
                <MotionLazy>
                  <ProgressBar />
                  <ToastProvider />
                  <SettingsDrawer />
                  <I18nProvider>{children}</I18nProvider>
                </MotionLazy>

              </ThemeProvider>
            </SettingsProvider>
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
