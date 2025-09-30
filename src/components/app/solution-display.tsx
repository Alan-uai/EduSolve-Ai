
"use client";

import { AlertCircle, CheckCircle, Pencil, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { markdownToHtml } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface SolutionDisplayProps {
  isLoading: boolean;
  solution?: string;
  error?: string;
  onFollowUp: (question: string) => void;
}

function SolutionStep({ step, onFollowUp }: { step: string; onFollowUp: (question: string) => void }) {
  const [followUpText, setFollowUpText] = useState("");
  const solutionHtml = markdownToHtml(step);

  const handleAsk = () => {
    if (!followUpText.trim()) return;
    const fullQuestion = `Referente a este trecho da solução: "${step.substring(0, 100)}..."\n\nMinha pergunta é: ${followUpText}`;
    onFollowUp(fullQuestion);
    setFollowUpText("");
  }

  return (
    <Collapsible>
      <div className="relative group">
        <div 
          className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap font-body"
          dangerouslySetInnerHTML={{ __html: solutionHtml }}
        />
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Faça uma pergunta sobre esta etapa</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg flex flex-col gap-2 animate-in fade-in-50 duration-300">
           <Textarea
            placeholder="Qual é a sua dúvida sobre esta etapa?"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
          />
          <Button size="sm" onClick={handleAsk} className="self-end">
            <Send className="mr-2 h-4 w-4" />
            Perguntar
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}


export function SolutionDisplay({ isLoading, solution, error, onFollowUp }: SolutionDisplayProps) {
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
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!solution) {
     return (
        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Sua solução passo a passo aparecerá aqui.</h3>
            <p className="text-sm text-muted-foreground/80 mt-1">Escaneie ou digite um problema acima para começar.</p>
        </div>
     )
  }

  const solutionSteps = solution.split(/^-{3,}\s*$/gm).filter(step => step.trim() !== "");

  return (
    <Card className="w-full animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-accent-foreground" />
          Solução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 divide-y divide-accent-foreground/20">
        {solutionSteps.map((step, index) => (
          <div key={index} className="pt-4 first:pt-0">
             <SolutionStep step={step} onFollowUp={onFollowUp} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

    