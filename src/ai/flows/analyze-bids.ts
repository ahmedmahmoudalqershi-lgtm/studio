
'use server';
/**
 * @fileOverview This file implements a Genkit flow to analyze and compare engineer bids for a maintenance request.
 *
 * - analyzeBids - A function that helps hospitals choose the best bid using AI.
 * - AnalyzeBidsInput - The input type.
 * - AnalyzeBidsOutput - The return type.
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
  summary: z.string().describe('A summary comparing the bids.'),
  bestOption: z.object({
    engineerName: z.string(),
    reason: z.string(),
  }),
  riskAnalysis: z.string().describe('Potential risks identified in the bids.'),
});
export type AnalyzeBidsOutput = z.infer<typeof AnalyzeBidsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeBidsPrompt',
  input: {schema: AnalyzeBidsInputSchema},
  output: {schema: AnalyzeBidsOutputSchema},
  prompt: `You are an AI advisor for a hospital management team. Your task is to analyze and compare several maintenance bids from engineers for a specific medical device repair request.

Request: {{{requestTitle}}}
Details: {{{requestDescription}}}

Bids to compare:
{{#each bids}}
- Engineer: {{{this.engineerName}}} (Rating: {{{this.rating}}}/5)
  Price: {{{this.price}}} SAR
  Time: {{{this.estimatedDays}}} days
  Proposal: {{{this.description}}}
{{/each}}

Provide a detailed comparison, recommend the best option based on balance of cost, time, and quality (rating), and highlight any potential risks (e.g., suspiciously low price, vague description).`,
});

const analyzeBidsFlow = ai.defineFlow(
  {
    name: 'analyzeBidsFlow',
    inputSchema: AnalyzeBidsInputSchema,
    outputSchema: AnalyzeBidsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function analyzeBids(input: AnalyzeBidsInput): Promise<AnalyzeBidsOutput> {
  return analyzeBidsFlow(input);
}
