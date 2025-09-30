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
      return { error: 'Nenhum problema fornecido. Por favor, envie uma imagem ou digite o texto do problema.' };
    }

    const result = await scanProblemAndGenerateSolution(input);
    if (!result.solution) {
      return { error: 'A IA não conseguiu gerar uma solução. Por favor, tente novamente.' };
    }
    return { solution: result.solution };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return { error: `Falha ao gerar solução: ${errorMessage}` };
  }
}

export async function generateChatResponse(
  history: ChatMessage[],
  prompt: string,
  images: string[]
): Promise<ChatState> {
  try {
    if (images.length === 0 && !prompt) {
      return { error: 'Nenhum prompt ou imagem fornecida. Por favor, insira uma mensagem ou envie uma imagem.' };
    }
    const result = await generateChatResponseFlow(history, prompt, images);
    if (!result) {
      return { error: 'A IA não conseguiu gerar uma resposta. Por favor, tente novamente.' };
    }
    return { response: result };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return { error: `Falha ao gerar resposta: ${errorMessage}` };
  }
}
