'use server';
/**
 * @fileOverview This file defines a Genkit flow for a multi-turn chat conversation.
 *
 * - generateChatResponse - The main function to continue a chat conversation.
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
  prompt: z.string(),
  images: z.array(z.string()).optional(),
});

const ChatFlowOutputSchema = z.string();


export async function generateChatResponse(
  history: ChatMessage[],
  prompt: string,
  images?: string[]
): Promise<string> {
  return chatFlow({ history, prompt, images });
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  async ({ history, prompt, images }) => {

    const userContent = [] as any[];
    userContent.push({ text: prompt });
    if (images) {
      images.forEach(url => {
        userContent.push({ media: { url } });
      });
    }

    const newHistory = [...history, { role: 'user', content: userContent }]

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      history: newHistory,
      prompt: `You are an expert math and science tutor. A student will provide you with one or more problems, either as text or in one or more images. Your response must be in Portuguese, unless the question is about the subject of English.

Your task is to identify every single problem presented and provide a detailed, step-by-step solution for each one. Ensure you solve all problems you find.

If multiple images are provided, they may represent different parts of the same problem. Please piece them together to form the complete problem before solving.
`,
    });

    return response.text;
  }
);
