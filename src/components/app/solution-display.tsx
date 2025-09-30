"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { markdownToHtml } from "@/lib/utils";

interface SolutionDisplayProps {
  isLoading: boolean;
  solution?: string;
  error?: string;
}

export function SolutionDisplay({ isLoading, solution, error }: SolutionDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!solution) {
     return (
        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Your step-by-step solution will appear here.</h3>
            <p className="text-sm text-muted-foreground/80 mt-1">Scan or type a problem above to get started.</p>
        </div>
     )
  }

  const solutionHtml = markdownToHtml(solution);

  return (
    <Card className="w-full animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-accent-foreground" />
          Solution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
            className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap font-body"
            dangerouslySetInnerHTML={{ __html: solutionHtml }}
        />
      </CardContent>
    </Card>
  );
}
