'use server';

import { scanProblemAndGenerateSolution } from '@/ai/flows/scan-problem-and-generate-solution';
import type { ScanProblemAndGenerateSolutionInput } from '@/ai/flows/scan-problem-and-generate-solution';
import { generateChatResponse as generateChatResponseFlow } from '@/ai/flows/chat-flow';
import type { ChatMessage } from '@/ai/flows/chat-flow';

type SolveState = {
  solution?: string;
  error?: string;
};

type ChatState = {
  response?: string;
  error?: string;
}

export async function generateSolution(
  input: ScanProblemAndGenerateSolutionInput
): Promise<SolveState> {
  try {
    if ((!input.problemImages || input.problemImages.length === 0) && !input.problemText) {
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

export async function generateChatResponse(
  history: ChatMessage[],
  prompt: string,
  images: string[]
): Promise<ChatState> {
  try {
    if (images.length === 0 && !prompt) {
      return { error: 'No prompt or image provided. Please enter a message or upload an image.' };
    }
    const result = await generateChatResponseFlow(history, prompt, images);
    if (!result) {
      return { error: 'The AI could not generate a response. Please try again.' };
    }
    return { response: result };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate response: ${errorMessage}` };
  }
}
