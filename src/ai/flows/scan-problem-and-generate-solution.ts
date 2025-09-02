'use server';
/**
 * @fileOverview This file defines a Genkit flow for scanning a math problem and generating a step-by-step solution.
 *
 * - scanProblemAndGenerateSolution - The main function to initiate the problem scanning and solution generation process.
 * - ScanProblemAndGenerateSolutionInput - The input type for the scanProblemAndGenerateSolution function.
 * - ScanProblemAndGenerateSolutionOutput - The output type for the scanProblemAndGenerateSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanProblemAndGenerateSolutionInputSchema = z.object({
  problemImage: z
    .string()
    .describe(
      "A photo of a math or science problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanProblemAndGenerateSolutionInput = z.infer<typeof ScanProblemAndGenerateSolutionInputSchema>;

const ScanProblemAndGenerateSolutionOutputSchema = z.object({
  solution: z.string().describe('A detailed, step-by-step solution to the problem.'),
});
export type ScanProblemAndGenerateSolutionOutput = z.infer<typeof ScanProblemAndGenerateSolutionOutputSchema>;

export async function scanProblemAndGenerateSolution(input: ScanProblemAndGenerateSolutionInput): Promise<ScanProblemAndGenerateSolutionOutput> {
  return scanProblemAndGenerateSolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanProblemAndGenerateSolutionPrompt',
  input: {schema: ScanProblemAndGenerateSolutionInputSchema},
  output: {schema: ScanProblemAndGenerateSolutionOutputSchema},
  prompt: `You are an expert math and science tutor. A student will provide you with an image of a problem. Extract the problem from the image and provide a detailed, step-by-step solution that the student can easily understand.

Problem Image: {{media url=problemImage}}`,
});

const scanProblemAndGenerateSolutionFlow = ai.defineFlow(
  {
    name: 'scanProblemAndGenerateSolutionFlow',
    inputSchema: ScanProblemAndGenerateSolutionInputSchema,
    outputSchema: ScanProblemAndGenerateSolutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
