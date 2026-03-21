import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // الانتقال إلى موديل 1.5-flash لضمان حصة طلبات (Quota) أكبر واستقرار أعلى في النسخة المجانية
  model: 'googleai/gemini-1.5-flash',
});
