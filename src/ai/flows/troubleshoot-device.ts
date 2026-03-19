'use server';
/**
 * @fileOverview ذكاء اصطناعي لاستكشاف الأعطال الطبية البسيطة وتوفير حلول فورية.
 *
 * - troubleshootDevice - وظيفة توفر نصائح تقنية فورية بناءً على نوع الجهاز والعطل.
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
  input: {schema: TroubleshootInputSchema},
  output: {schema: TroubleshootOutputSchema},
  prompt: `أنت خبير صيانة أجهزة طبية محترف. 
بناءً على المعلومات التالية، قدم دليلاً سريعاً لاستكشاف العطل وإصلاحه (Troubleshooting) لمساعدة موظفي المستشفى.

الجهاز: {{{deviceName}}}
المشكلة: {{{issueDescription}}}

يجب أن تكون الخطوات واضحة، آمنة، وتقنية. إذا كانت المشكلة تتضمن كهرباء عالية أو أجزاء حساسة، شدد على أهمية عدم المحاولة وطلب المهندس فوراً.`,
});

const troubleshootFlow = ai.defineFlow(
  {
    name: 'troubleshootFlow',
    inputSchema: TroubleshootInputSchema,
    outputSchema: TroubleshootOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function troubleshootDevice(input: TroubleshootInput): Promise<TroubleshootOutput> {
  return troubleshootFlow(input);
}
