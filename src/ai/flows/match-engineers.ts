
'use server';
/**
 * @fileOverview محرك المطابقة الذكي لربط طلبات الصيانة بالمهندسين الأكثر كفاءة.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const maxDuration = 60; // Increase timeout for Vercel

const EngineerBriefSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  specialization: z.string(),
  yearsExperience: z.number(),
  rating: z.number(),
  totalJobs: z.number(),
});

const MatchEngineersInputSchema = z.object({
  requestTitle: z.string(),
  requestDescription: z.string(),
  deviceSpecialization: z.string(),
  availableEngineers: z.array(EngineerBriefSchema),
});
export type MatchEngineersInput = z.infer<typeof MatchEngineersInputSchema>;

const MatchResultSchema = z.object({
  engineerId: z.string(),
  matchScore: z.number().describe('نسبة المطابقة من 100'),
  reason: z.string().describe('سبب الترشيح باللغة العربية'),
});

const MatchEngineersOutputSchema = z.object({
  recommendations: z.array(MatchResultSchema),
});
export type MatchEngineersOutput = z.infer<typeof MatchEngineersOutputSchema>;

const prompt = ai.definePrompt({
  name: 'matchEngineersPrompt',
  input: {schema: MatchEngineersInputSchema},
  output: {schema: MatchEngineersOutputSchema},
  prompt: `أنت خبير توظيف تقني في مجال الهندسة الطبية. مهمتك هي اختيار أفضل 3 مهندسين من القائمة المتاحة للقيام بطلب صيانة محدد.

الطلب: {{{requestTitle}}}
التخصص المطلوب: {{{deviceSpecialization}}}
الوصف الفني: {{{requestDescription}}}

المهندسون المتاحون:
{{#each availableEngineers}}
- {{{this.fullName}}} (تخصص: {{{this.specialization}}}, خبرة: {{{this.yearsExperience}}} سنة, تقييم: {{{this.rating}}}/5, أعمال منجزة: {{{this.totalJobs}}})
{{/each}}

قم بتحليل البيانات واختر أفضل المطابقات بناءً على:
1. تطابق التخصص الدقيق أو القريب.
2. سنوات الخبرة في هذا النوع من الأجهزة.
3. سجل الإنجاز والتقييم.

يجب أن تكون الأسباب مقنعة ومكتوبة باللغة العربية المهنية.`,
});

const matchEngineersFlow = ai.defineFlow(
  {
    name: 'matchEngineersFlow',
    inputSchema: MatchEngineersInputSchema,
    outputSchema: MatchEngineersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function matchEngineers(input: MatchEngineersInput): Promise<MatchEngineersOutput> {
  return matchEngineersFlow(input);
}
