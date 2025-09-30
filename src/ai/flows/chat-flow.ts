
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
      history: history.slice(0, -1),
      prompt: history[history.length - 1].content,
    });

    return response.text;
  }
);
