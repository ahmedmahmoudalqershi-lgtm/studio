'use server';
/**
 * @fileOverview يساعد هذا الملف مستخدمي المستشفيات في صياغة أوصاف دقيقة لطلبات الصيانة باستخدام الذكاء الاصطناعي باللغة العربية.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMaintenanceRequestDescriptionInputSchema = z.object({
  deviceName: z.string().describe('اسم الجهاز الطبي الذي يحتاج لصيانة.'),
  reportedProblem: z.string().describe('وصف مختصر للمشكلة المبلغ عنها.'),
});
export type GenerateMaintenanceRequestDescriptionInput = z.infer<typeof GenerateMaintenanceRequestDescriptionInputSchema>;

const GenerateMaintenanceRequestDescriptionOutputSchema = z.object({
  detailedDescription: z.string().describe('وصف مفصل وشامل لطلب الصيانة باللغة العربية.'),
});
export type GenerateMaintenanceRequestDescriptionOutput = z.infer<typeof GenerateMaintenanceRequestDescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateMaintenanceDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateMaintenanceRequestDescriptionInputSchema},
  output: {schema: GenerateMaintenanceRequestDescriptionOutputSchema},
  prompt: `أنت مساعد ذكاء اصطناعي متخصص في صيانة الأجهزة الطبية. مهمتك هي مساعدة موظفي المستشفى في صياغة وصف تقني دقيق واحترافي لطلب صيانة.

بناءً على المعلومات البسيطة التالية، قم بتوليد وصف مفصل باللغة العربية يتضمن صياغة واضحة للمشكلة وتأثيرها وأي تفاصيل فنية تساعد المهندس.

اسم الجهاز: {{{deviceName}}}
المشكلة المبلغ عنها: {{{reportedProblem}}}`,
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

const generateMaintenanceRequestDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMaintenanceRequestDescriptionFlow',
    inputSchema: GenerateMaintenanceRequestDescriptionInputSchema,
    outputSchema: GenerateMaintenanceRequestDescriptionOutputSchema,
  },
  async input => {
    return await runWithRetry(async () => {
      const {output} = await prompt(input);
      return output!;
    });
  }
);

export async function generateMaintenanceRequestDescription(
  input: GenerateMaintenanceRequestDescriptionInput
): Promise<GenerateMaintenanceRequestDescriptionOutput> {
  return generateMaintenanceRequestDescriptionFlow(input);
}
