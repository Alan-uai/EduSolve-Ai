
'use server';
/**
 * @fileOverview This file defines a Genkit flow for a multi-turn chat conversation.
 *
 * - generateChatResponse - The main function to continue a a chat conversation.
 * - ChatMessage - The type for a single message in the chat history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatPartSchema = z.union([
  z.object({
    text: z.string(),
  }),
  z.object({
    media: z.object({
      url: z.string().describe(
        "A media file, as a data URI. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    }),
  }),
]);

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(ChatPartSchema),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatFlowInputSchema = z.object({
  history: z.array(ChatMessageSchema),
  // The prompt and images are part of the last message in history, so we don't need them as separate inputs.
});

const ChatFlowOutputSchema = z.string();


export async function generateChatResponse(
  history: ChatMessage[],
): Promise<string> {
  return chatFlow({ history });
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  async ({ history }) => {

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      history: history,
      prompt: `You are an expert math and science tutor. A student will provide you with one or more problems, either as text or in one or more images. Your response must be in Portuguese, unless the question is about the subject of English.

Your task is to identify every single problem presented and provide a detailed, step-by-step solution for each one. Ensure you solve all problems you find.

If multiple images are provided, they may represent different parts of the same problem. Please piece them together to form the complete problem before solving.

If the problem is a multiple-choice question, follow these steps:
1. First, solve the problem and determine the correct answer on your own.
2. After finding your answer, compare it carefully with the provided options.
3. Finally, state which alternative (e.g., a, b, c, d) matches your solution.
`,
    });

    return response.text;
  }
);
