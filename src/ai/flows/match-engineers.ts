'use server';
/**
 * @fileOverview محرك المطابقة الذكي لربط طلبات الصيانة بالمهندسين الأكثر كفاءة.
 * تم تحسينه ليفهم السياق التقني الكامل بدلاً من الكلمات المنفردة.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EngineerBriefSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  specialization: z.string(),
  yearsExperience: z.number(),
  rating: z.number(),
  totalJobs: z.number(),
});

const MatchEngineersInputSchema = z.object({
  requestTitle: z.string().describe('عنوان طلب الصيانة بالكامل.'),
  requestDescription: z.string().describe('وصف العطل التقني.'),
  availableEngineers: z.array(EngineerBriefSchema).describe('قائمة المهندسين المتاحين للتحليل.'),
});
export type MatchEngineersInput = z.infer<typeof MatchEngineersInputSchema>;

const MatchResultSchema = z.object({
  engineerId: z.string(),
  matchScore: z.number().describe('نسبة المطابقة من 100 بناءً على الملاءمة التقنية.'),
  reason: z.string().describe('سبب الترشيح الفني المفصل باللغة العربية.'),
});

const MatchEngineersOutputSchema = z.object({
  recommendations: z.array(MatchResultSchema),
});
export type MatchEngineersOutput = z.infer<typeof MatchEngineersOutputSchema>;

const prompt = ai.definePrompt({
  name: 'matchEngineersPrompt',
  input: {schema: MatchEngineersInputSchema},
  output: {schema: MatchEngineersOutputSchema},
  prompt: `أنت خبير توظيف فني متخصص في الهندسة الطبية الحيوية. مهمتك هي تحليل طلب صيانة وترشيح أفضل 3 مهندسين من القائمة المتاحة.

الطلب المراد تغطيته:
- العنوان: {{{requestTitle}}}
- الوصف الفني: {{{requestDescription}}}

المهندسون المرشحون للتقييم:
{{#each availableEngineers}}
- المعرف: {{{this.id}}} | الاسم: {{{this.fullName}}} | التخصص: {{{this.specialization}}} | خبرة: {{{this.yearsExperience}}} سنة | تقييم: {{{this.rating}}} | أعمال سابقة: {{{this.totalJobs}}}
{{/each}}

قواعد المطابقة المنطقية:
1. المطابقة الدلالية: ابحث عن التوافق التقني (مثلاً: إذا كان الطلب "أشعة مقطعية" والمهندس تخصصه "أشعة"، فهذه مطابقة ممتازة).
2. الخبرة النوعية: فضل المهندس الذي يملك سنوات خبرة أكثر في نفس المجال التقني للطلب.
3. التقييم والإنجاز: فضل المهندسين ذوي التقييمات العالية والأعمال المنجزة الناجحة.

يجب أن تعيد قائمة بأفضل 3 مهندسين مع ذكر سبب "تقني ومنطقي" جداً لكل ترشيح باللغة العربية. إذا لم تجد مهندس بتخصص مطابق تماماً، ابحث عن الأقرب مهارةً.`,
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
