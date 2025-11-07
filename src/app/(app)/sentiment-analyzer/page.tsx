'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';
import {
  analyzeCitizenFeedbackSentiment,
  type SentimentState,
} from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bot } from 'lucide-react';
import SentimentAnalysisResult from '@/components/sentiment-analysis-result';

export default function SentimentAnalyzerPage() {
  const initialState: SentimentState = {
    message: null,
    errors: {},
    analysis: null,
  };
  const [state, dispatch] = useActionState(
    analyzeCitizenFeedbackSentiment,
    initialState
  );

  return (
    <>
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> AI Powered Sentiment Analyzer
        </h2>
        <p className="text-muted-foreground">
          Assess the sentiment of citizen feedback to better gauge urgent
          concerns.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Analyze Feedback</CardTitle>
            <CardDescription>
              Enter a piece of citizen feedback below to analyze its sentiment.
            </CardDescription>
          </CardHeader>
          <form action={dispatch}>
            <CardContent>
              <div className="grid w-full gap-2">
                <Label htmlFor="feedbackText">Feedback Text</Label>
                <Textarea
                  id="feedbackText"
                  name="feedbackText"
                  placeholder="Type or paste citizen feedback here..."
                  className="min-h-[150px]"
                />
                {state.errors?.feedbackText && (
                  <p className="text-sm font-medium text-destructive">
                    {state.errors.feedbackText[0]}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>

        <SentimentAnalysisResult state={state} />
      </div>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Analyzing...' : 'Analyze Sentiment'}
    </Button>
  );
}
