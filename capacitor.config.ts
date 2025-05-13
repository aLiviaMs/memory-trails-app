import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'memory.trails.app',
  appName: 'memory-trails-app',
  webDir: 'www',
    server: {
    url: 'http://localhost:8100',
    cleartext: true
  }
};

export default config;
