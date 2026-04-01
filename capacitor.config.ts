import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.titanartstudio.pdftool',
  appName: 'PDF Toolkit',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;