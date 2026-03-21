
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // استخدام الموديل المستقر gemini-1.5-flash لضمان أفضل أداء وحصة طلبات في النسخة المجانية
  model: 'googleai/gemini-1.5-flash',
});
