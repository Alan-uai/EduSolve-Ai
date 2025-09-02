"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Camera, Type, LoaderCircle, WandSparkles } from "lucide-react";
import { generateSolution } from "@/app/actions";
import { cn } from "@/lib/utils";

import { SolutionDisplay } from "./solution-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type State = {
  solution?: string;
  error?: string;
};

export function ProblemForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<State>({});
  const [activeTab, setActiveTab] = useState("scan");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [problemText, setProblemText] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const textToSvgDataUri = (text: string) => {
    const sanitizedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
        <rect width="100%" height="100%" fill="#F5F5F5"/>
        <text x="20" y="40" font-family="PT Sans, sans-serif" font-size="16px" fill="black">
          ${sanitizedText.split('\n').map(line => `<tspan x="20" dy="1.2em">${line}</tspan>`).join('')}
        </text>
      </svg>
    `;
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    return `data:image/svg+xml;base64,${base64}`;
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    setState({}); // Clear previous state
    let dataUri = "";

    try {
      if (activeTab === "scan") {
        if (!imageFile) {
          toast({ variant: "destructive", title: "No image selected", description: "Please upload an image of the problem." });
          return;
        }
        dataUri = await fileToDataUri(imageFile);
      } else {
        if (!problemText.trim()) {
          toast({ variant: "destructive", title: "No text entered", description: "Please type the problem in the text area." });
          return;
        }
        dataUri = textToSvgDataUri(problemText);
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error processing input", description: "Could not prepare the problem for the AI." });
       return;
    }

    startTransition(async () => {
      const result = await generateSolution({ problemImage: dataUri });
      if (result.error) {
        toast({ variant: "destructive", title: "AI Error", description: result.error });
      }
      setState(result);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="scan" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">
            <Camera className="mr-2 h-4 w-4" /> Scan Problem
          </TabsTrigger>
          <TabsTrigger value="type">
            <Type className="mr-2 h-4 w-4" /> Type Problem
          </TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-6">
            <form
              ref={formRef}
              action={handleSubmit}
              className="flex flex-col gap-6"
            >
              <TabsContent value="scan" className="m-0">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <Label
                    htmlFor="image-upload"
                    className={cn(
                      "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors",
                      imagePreview && "border-solid"
                    )}
                  >
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Problem preview"
                        layout="fill"
                        objectFit="contain"
                        className="rounded-lg p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                      </div>
                    )}
                  </Label>
                  <Input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </div>
              </TabsContent>
              <TabsContent value="type" className="m-0">
                <Textarea
                  placeholder="For example: what is 2x + 5 = 15?"
                  className="min-h-[192px] text-base"
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                />
              </TabsContent>
              <Button type="submit" disabled={isPending} className="w-full font-bold text-lg py-6">
                {isPending ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    Solving...
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-5 w-5" />
                    Generate Solution
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Tabs>

      <SolutionDisplay
        isLoading={isPending}
        solution={state.solution}
        error={state.error}
      />
    </div>
  );
}
