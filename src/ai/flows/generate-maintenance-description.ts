'use server';
/**
 * @fileOverview This file implements a Genkit flow to assist hospital users in drafting detailed maintenance request descriptions.
 *
 * - generateMaintenanceRequestDescription - A function that leverages AI to generate comprehensive maintenance descriptions.
 * - GenerateMaintenanceRequestDescriptionInput - The input type for the generateMaintenanceRequestDescription function.
 * - GenerateMaintenanceRequestDescriptionOutput - The return type for the generateMaintenanceRequestDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMaintenanceRequestDescriptionInputSchema = z.object({
  deviceName: z.string().describe('The name of the medical device requiring maintenance.'),
  reportedProblem: z.string().describe('A brief description of the problem reported for the device.'),
});
export type GenerateMaintenanceRequestDescriptionInput = z.infer<typeof GenerateMaintenanceRequestDescriptionInputSchema>;

const GenerateMaintenanceRequestDescriptionOutputSchema = z.object({
  detailedDescription: z.string().describe('A detailed and comprehensive description for a maintenance request.'),
});
export type GenerateMaintenanceRequestDescriptionOutput = z.infer<typeof GenerateMaintenanceRequestDescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateMaintenanceDescriptionPrompt',
  input: {schema: GenerateMaintenanceRequestDescriptionInputSchema},
  output: {schema: GenerateMaintenanceRequestDescriptionOutputSchema},
  prompt: `You are an AI assistant designed to help hospital users create detailed and comprehensive maintenance request descriptions for medical devices. Your goal is to provide engineers with all the necessary information to give accurate quotes and perform effective repairs.

Based on the following simple inputs, generate a detailed maintenance request description that is clear, concise, and includes:
- A clear and concise statement of the problem.
- Any observable symptoms or error codes.
- When the problem started (if known).
- What attempts, if any, have been made to resolve the issue internally.
- Any critical impact on hospital operations or patient care.
- Any other relevant details that an engineer would need to diagnose and repair the device effectively.

Device Name: {{{deviceName}}}
Reported Problem: {{{reportedProblem}}}`,
});

const generateMaintenanceRequestDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMaintenanceRequestDescriptionFlow',
    inputSchema: GenerateMaintenanceRequestDescriptionInputSchema,
    outputSchema: GenerateMaintenanceRequestDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateMaintenanceRequestDescription(
  input: GenerateMaintenanceRequestDescriptionInput
): Promise<GenerateMaintenanceRequestDescriptionOutput> {
  return generateMaintenanceRequestDescriptionFlow(input);
}
