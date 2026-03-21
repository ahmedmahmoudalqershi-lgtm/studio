'use server';
/**
 * @fileOverview ذكاء اصطناعي لاستكشاف الأعطال الطبية البسيطة وتوفير حلول فورية.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TroubleshootInputSchema = z.object({
  deviceName: z.string().describe('اسم الجهاز الطبي'),
  issueDescription: z.string().describe('وصف المشكلة التي يواجهها المستخدم'),
});
export type TroubleshootInput = z.infer<typeof TroubleshootInputSchema>;

const TroubleshootOutputSchema = z.object({
  steps: z.array(z.string()).describe('خطوات استكشاف الخطأ المقترحة'),
  potentialCause: z.string().describe('السبب المحتمل للعطل'),
  safetyWarning: z.string().describe('تحذير أمان هام للمستخدم'),
  shouldCallEngineer: z.boolean().describe('هل تتطلب المشكلة تدخل مهندس متخصص فوراً؟'),
});
export type TroubleshootOutput = z.infer<typeof TroubleshootOutputSchema>;

const prompt = ai.definePrompt({
  name: 'troubleshootDevicePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: TroubleshootInputSchema},
  output: {schema: TroubleshootOutputSchema},
  prompt: `أنت خبير صيانة أجهزة طبية محترف. 
بناءً على المعلومات التالية، قدم دليلاً سريعاً لاستكشاف العطل وإصلاحه (Troubleshooting) لمساعدة موظفي المستشفى.

الجهاز: {{{deviceName}}}
المشكلة: {{{issueDescription}}}

يجب أن تكون الخطوات واضحة، آمنة، وتقنية. إذا كانت المشكلة تتضمن كهرباء عالية أو أجزاء حساسة، شدد على أهمية عدم المحاولة وطلب المهندس فوراً.`,
});

async function runWithRetry<O>(fn: () => Promise<O>, retries = 3): Promise<O> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.message || "";
    if (retries > 0 && (msg.includes('429') || msg.includes('Quota') || msg.includes('RESOURCES_EXHAUSTED'))) {
      await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
      return runWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

const troubleshootFlow = ai.defineFlow(
  {
    name: 'troubleshootFlow',
    inputSchema: TroubleshootInputSchema,
    outputSchema: TroubleshootOutputSchema,
  },
  async input => {
    return await runWithRetry(async () => {
      const {output} = await prompt(input);
      return output!;
    });
  }
);

export async function troubleshootDevice(input: TroubleshootInput): Promise<TroubleshootOutput> {
  return troubleshootFlow(input);
}
