'use server';

/**
 * @fileOverview A sentiment analysis AI agent for citizen feedback.
 *
 * - analyzeCitizenFeedbackSentiment - A function that analyzes the sentiment of citizen feedback.
 * - AnalyzeCitizenFeedbackSentimentInput - The input type for the analyzeCitizenFeedbackSentiment function.
 * - AnalyzeCitizenFeedbackSentimentOutput - The return type for the analyzeCitizenFeedbackSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCitizenFeedbackSentimentInputSchema = z.object({
  feedbackText: z
    .string()
    .describe('The text of the citizen feedback to analyze.'),
});
export type AnalyzeCitizenFeedbackSentimentInput = z.infer<
  typeof AnalyzeCitizenFeedbackSentimentInputSchema
>;

const AnalyzeCitizenFeedbackSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the feedback, can be positive, negative, or neutral.'
    ),
  confidence: z
    .number()
    .describe(
      'A number between 0 and 1 indicating the confidence in the sentiment analysis.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation of why the model determined the sentiment it did.'
    ),
});
export type AnalyzeCitizenFeedbackSentimentOutput = z.infer<
  typeof AnalyzeCitizenFeedbackSentimentOutputSchema
>;

export async function analyzeCitizenFeedbackSentiment(
  input: AnalyzeCitizenFeedbackSentimentInput
): Promise<AnalyzeCitizenFeedbackSentimentOutput> {
  return analyzeCitizenFeedbackSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCitizenFeedbackSentimentPrompt',
  input: {schema: AnalyzeCitizenFeedbackSentimentInputSchema},
  output: {schema: AnalyzeCitizenFeedbackSentimentOutputSchema},
  prompt: `You are a sentiment analysis expert. Analyze the sentiment of the following citizen feedback and provide a sentiment (positive, negative, or neutral), a confidence score (0-1), and a brief reason for your analysis.

Feedback: {{{feedbackText}}}

Respond in JSON format.`,
});

const analyzeCitizenFeedbackSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeCitizenFeedbackSentimentFlow',
    inputSchema: AnalyzeCitizenFeedbackSentimentInputSchema,
    outputSchema: AnalyzeCitizenFeedbackSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
