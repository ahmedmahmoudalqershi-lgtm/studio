'use server';
/**
 * @fileOverview يساعد المهندسين في صياغة عروض صيانة احترافية ومقنعة باستخدام الذكاء الاصطناعي باللغة العربية.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBidDescriptionInputSchema = z.object({
  requestTitle: z.string().describe('عنوان طلب الصيانة.'),
  requestDescription: z.string().describe('وصف المشكلة من قبل المستشفى.'),
  engineerNotes: z.string().optional().describe('ملاحظات أولية من المهندس أو خبراته ذات الصلة.'),
});
export type GenerateBidDescriptionInput = z.infer<typeof GenerateBidDescriptionInputSchema>;

const GenerateBidDescriptionOutputSchema = z.object({
  professionalDescription: z.string().describe('وصف تقني واحترافي للعرض باللغة العربية.'),
});
export type GenerateBidDescriptionOutput = z.infer<typeof GenerateBidDescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateBidDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateBidDescriptionInputSchema},
  output: {schema: GenerateBidDescriptionOutputSchema},
  prompt: `أنت مهندس صيانة أجهزة طبية خبير ومحترف في كتابة العروض التقنية. مهمتك هي مساعدة المهندس في صياغة "وصف العرض" لطلب صيانة محدد بطريقة تقنية، مقنعة، ومنطقية.

يجب أن يتضمن الوصف المولد باللغة العربية:
1. تحليل تقني سريع للمشكلة بناءً على الوصف المقدم.
2. خطة العمل المقترحة (خطوات التشخيص والإصلاح).
3. التأكيد على معايير السلامة والجودة والمعايرة بعد الإصلاح.
4. لمحة عن الخبرة المهنية في هذا النوع من الأجهزة (بناءً على ملاحظات المهندس إن وجدت).

تفاصيل الطلب:
العنوان: {{{requestTitle}}}
الوصف: {{{requestDescription}}}

ملاحظات المهندس الإضافية: {{{engineerNotes}}}

اجعل النص احترافياً جداً، يبعث على الثقة لمسؤولي المستشفى، ويركز على الجودة التقنية قبل كل شيء. لا تكتفِ بذكر السعر، بل اشرح "كيف" ستقوم بالعمل.`,
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

const generateBidDescriptionFlow = ai.defineFlow(
  {
    name: 'generateBidDescriptionFlow',
    inputSchema: GenerateBidDescriptionInputSchema,
    outputSchema: GenerateBidDescriptionOutputSchema,
  },
  async input => {
    return await runWithRetry(async () => {
      const {output} = await prompt(input);
      return output!;
    });
  }
);

export async function generateBidDescription(
  input: GenerateBidDescriptionInput
): Promise<GenerateBidDescriptionOutput> {
  return generateBidDescriptionFlow(input);
}
