
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { nextDev } from '@genkit-ai/next';
import { z } from 'genkit/zod';
import { firebase } from '@genkit-ai/firebase';

import '@/ai/flows/detect-language-flow';
import '@/ai/flows/send-push-notification-flow';
import '@/ai/flows/translate-message-flow';

export default genkit({
  plugins: [
    firebase(),
    googleAI({
      apiVersion: 'v1beta',
    }),
    nextDev(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
