
'use server';
/**
 * @fileOverview محرك المطابقة الذكي لربط طلبات الصيانة بالمهندسين الأكثر كفاءة.
 * تم تحسينه بنظام محاولة تلقائية (Retry) متطور للتعامل مع حدود الحصة المجانية (Quota).
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
1. المطابقة الدلالية الشاملة: ابحث عن التوافق التقني (مثلاً: إذا كان الطلب يتضمن كلمة "أشعة" أو "MRI" والمهندس تخصصه "أشعة"، فهذه مطابقة ممتازة).
2. المطابقة عبر التخصصات القريبة: إذا كان التخصص قريباً أو يقع ضمن نفس المجال الطبي، قم بترشيح المهندس واذكر السبب.
3. الخبرة والتقييم: فضل المهندسين ذوي الخبرة العالية والتقييمات المتميزة.

يجب أن تعيد قائمة بأفضل 3 مهندسين مع ذكر سبب "تقني ومنطقي" باللغة العربية لكل مرشح.`,
});

/**
 * وظيفة مساعدة للتعامل مع أخطاء Quota (429) و Resource Exhausted عبر إعادة المحاولة.
 */
async function runWithRetry<I, O>(fn: (input: I) => Promise<O>, input: I, retries = 3): Promise<O> {
  try {
    return await fn(input);
  } catch (error: any) {
    const errorMessage = error.message || "";
    const isRetryable = 
      errorMessage.includes('429') || 
      errorMessage.includes('Quota') || 
      errorMessage.includes('RESOURCES_EXHAUSTED') ||
      errorMessage.includes('Too Many Requests');

    if (retries > 0 && isRetryable) {
      // الانتظار لفترة متزايدة قبل إعادة المحاولة (Exponential Backoff)
      const waitTime = (4 - retries) * 2000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return runWithRetry(fn, input, retries - 1);
    }
    throw error;
  }
}

const matchEngineersFlow = ai.defineFlow(
  {
    name: 'matchEngineersFlow',
    inputSchema: MatchEngineersInputSchema,
    outputSchema: MatchEngineersOutputSchema,
  },
  async input => {
    // استخدام runWithRetry مباشرة على استدعاء الـ prompt
    const {output} = await runWithRetry(() => prompt(input), input);
    return output!;
  }
);

export async function matchEngineers(input: MatchEngineersInput): Promise<MatchEngineersOutput> {
  return matchEngineersFlow(input);
}
