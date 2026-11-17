import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fathan.ironpulse',
  appName: 'IronPulse',
  webDir: 'dist',
  backgroundColor: '#0A0B0E',
  android: {
    backgroundColor: '#0A0B0E',
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#C8FF2E',
      sound: 'ironpulse_alarm.wav',
    },
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
