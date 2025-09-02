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
  problemImages: z.array(z.string()).optional()
    .describe(
      "An array of photos of a math or science problem, as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  problemText: z.string().optional().describe("A math or science problem, as a string of text."),
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
  prompt: `You are an expert math and science tutor. A student will provide you with a problem, either as text or one or more images. Your response must be in Portuguese, unless the question is about the subject of English. Extract the problem and provide a detailed, step-by-step solution that the student can easily understand.

If multiple images are provided, they may represent different parts of the same problem. Please piece them together to form the complete problem before solving.

{{#if problemText}}
Problem Text:
{{problemText}}
{{/if}}

{{#if problemImages}}
Problem Images:
{{#each problemImages}}
{{media url=this}}
{{/each}}
{{/if}}
`,
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
