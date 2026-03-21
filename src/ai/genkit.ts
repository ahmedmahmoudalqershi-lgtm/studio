
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // استخدام المسمى الكامل للموديل لضمان التوافق مع API v1beta وتجنب أخطاء 404
  model: 'googleai/gemini-1.5-flash',
});
