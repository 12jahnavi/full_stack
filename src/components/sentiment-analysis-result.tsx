'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot, ThumbsUp, ThumbsDown, Meh, Loader2 } from 'lucide-react';
import type { SentimentState } from '@/lib/actions';
import { useFormStatus } from 'react-dom';

const SentimentIcon = ({ sentiment }: { sentiment: string | undefined }) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return <ThumbsUp className="h-10 w-10 text-green-500" />;
    case 'negative':
      return <ThumbsDown className="h-10 w-10 text-red-500" />;
    case 'neutral':
      return <Meh className="h-10 w-10 text-yellow-500" />;
    default:
      return <Bot className="h-10 w-10 text-muted-foreground" />;
  }
};

export default function SentimentAnalysisResult({ state }: { state: SentimentState }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <Card className="flex flex-col items-center justify-center">
        <CardHeader className="items-center text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <CardTitle>Analyzing...</CardTitle>
          <CardDescription>Our AI is processing the feedback.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!state.analysis) {
    return (
       <Card>
        <CardHeader className="items-center text-center">
          <Bot className="h-10 w-10 text-muted-foreground" />
          <CardTitle>Awaiting Analysis</CardTitle>
          <CardDescription>Results will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
            {state.message && <p className="text-destructive">{state.message}</p>}
            {(!state.message && !state.errors) && <p>Enter feedback and click "Analyze" to see the result.</p>}
        </CardContent>
      </Card>
    );
  }

  const { sentiment, confidence, reason } = state.analysis;
  const confidencePercentage = Math.round(confidence * 100);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <SentimentIcon sentiment={sentiment} />
        <CardTitle>Analysis Result</CardTitle>
        <CardDescription>
          Sentiment: <span className="font-bold capitalize">{sentiment}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">Confidence</span>
            <span className="text-sm font-bold">{confidencePercentage}%</span>
          </div>
          <Progress value={confidencePercentage} aria-label={`${confidencePercentage}% confidence`} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Reasoning</h4>
          <p className="text-sm p-3 bg-muted rounded-md border">{reason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
