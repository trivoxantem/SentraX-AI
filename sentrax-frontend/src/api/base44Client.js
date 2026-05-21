import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// Initialize the Base44 SDK client
export const base44 = createClient({
  appId: appParams.appId,
  token: appParams.token,
  appBaseUrl: appParams.appBaseUrl || 'https://api.base44.io',
});
