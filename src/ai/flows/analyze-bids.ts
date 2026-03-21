'use server';
/**
 * @fileOverview يقوم هذا الملف بتحليل ومقارنة عروض المهندسين لمساعدة المستشفيات في اختيار العرض الأنسب.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BidSchema = z.object({
  engineerName: z.string(),
  price: z.number(),
  estimatedDays: z.number(),
  description: z.string(),
  rating: z.number(),
});

const AnalyzeBidsInputSchema = z.object({
  requestTitle: z.string(),
  requestDescription: z.string(),
  bids: z.array(BidSchema),
});
export type AnalyzeBidsInput = z.infer<typeof AnalyzeBidsInputSchema>;

const AnalyzeBidsOutputSchema = z.object({
  summary: z.string().describe('ملخص مقارنة العروض باللغة العربية.'),
  bestOption: z.object({
    engineerName: z.string(),
    reason: z.string().describe('سبب اختيار هذا المهندس كأفضل خيار.'),
  }),
  riskAnalysis: z.string().describe('تحليل المخاطر المحتملة في العروض.'),
});
export type AnalyzeBidsOutput = z.infer<typeof AnalyzeBidsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeBidsPrompt',
  input: {schema: AnalyzeBidsInputSchema},
  output: {schema: AnalyzeBidsOutputSchema},
  prompt: `أنت مستشار ذكي لإدارة المستشفيات. مهمتك هي تحليل ومقارنة عدة عروض مقدمة من مهندسي الصيانة لطلب محدد.

الطلب: {{{requestTitle}}}
التفاصيل: {{{requestDescription}}}

العروض المتاحة:
{{#each bids}}
- المهندس: {{{this.engineerName}}} (التقييم: {{{this.rating}}}/5)
  السعر: {{{this.price}}} ريال
  المدة: {{{this.estimatedDays}}} أيام
  تفاصيل العرض: {{{this.description}}}
{{/each}}

قم بتقديم مقارنة دقيقة باللغة العربية، ورشح أفضل خيار بناءً على التوازن بين السعر والمدة والتقييم.`,
});

async function runWithRetry<I, O>(fn: (input: I) => Promise<O>, input: I, retries = 2): Promise<O> {
  try {
    return await fn(input);
  } catch (error: any) {
    const isQuotaError = error.message?.includes('429') || error.message?.includes('Quota');
    if (retries > 0 && isQuotaError) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return runWithRetry(fn, input, retries - 1);
    }
    throw error;
  }
}

const analyzeBidsFlow = ai.defineFlow(
  {
    name: 'analyzeBidsFlow',
    inputSchema: AnalyzeBidsInputSchema,
    outputSchema: AnalyzeBidsOutputSchema,
  },
  async input => {
    const {output} = await runWithRetry(prompt, input);
    return output!;
  }
);

export async function analyzeBids(input: AnalyzeBidsInput): Promise<AnalyzeBidsOutput> {
  return analyzeBidsFlow(input);
}
