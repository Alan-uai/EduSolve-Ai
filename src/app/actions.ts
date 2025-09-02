'use server';

import { scanProblemAndGenerateSolution } from '@/ai/flows/scan-problem-and-generate-solution';
import type { ScanProblemAndGenerateSolutionInput } from '@/ai/flows/scan-problem-and-generate-solution';

type FormState = {
  solution?: string;
  error?: string;
};

export async function generateSolution(
  input: ScanProblemAndGenerateSolutionInput
): Promise<FormState> {
  try {
    if (!input.problemImage) {
      return { error: 'No problem provided. Please upload an image or type the problem text.' };
    }

    const result = await scanProblemAndGenerateSolution(input);
    if (!result.solution) {
      return { error: 'The AI could not generate a solution. Please try again.' };
    }
    return { solution: result.solution };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate solution: ${errorMessage}` };
  }
}
