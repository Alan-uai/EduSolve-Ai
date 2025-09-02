"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Camera, Type, LoaderCircle, WandSparkles, X } from "lucide-react";
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

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [problemText, setProblemText] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const newFiles = [...imageFiles, ...files];
      setImageFiles(newFiles);

      const newPreviews = [...imagePreviews];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          // Update previews after each file is read
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    // Reset file input value to allow re-uploading the same file
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };


  const filesToDataUris = (files: File[]): Promise<string[]> => {
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({}); // Clear previous state

    startTransition(async () => {
      let result;
      if (activeTab === "scan") {
        if (imageFiles.length === 0) {
          toast({ variant: "destructive", title: "No image selected", description: "Please upload at least one image of the problem." });
          return;
        }
        try {
          const dataUris = await filesToDataUris(imageFiles);
          result = await generateSolution({ problemImages: dataUris });
        } catch (error) {
          toast({ variant: "destructive", title: "Error processing images", description: "Could not prepare the images for the AI." });
          return;
        }
      } else {
        if (!problemText.trim()) {
          toast({ variant: "destructive", title: "No text entered", description: "Please type the problem in the text area." });
          return;
        }
        result = await generateSolution({ problemText: problemText });
      }

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
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
            >
              <TabsContent value="scan" className="m-0">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <Label
                    htmlFor="image-upload"
                    className={cn(
                      "relative flex flex-col items-center justify-center w-full min-h-[12rem] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors",
                      imagePreviews.length > 0 && "border-solid p-4"
                    )}
                  >
                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imagePreviews.map((src, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={src}
                              alt={`Problem preview ${index + 1}`}
                              width={150}
                              height={150}
                              className="rounded-lg object-cover aspect-square"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeImage(index);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
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
                  <Input ref={inputRef} id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} multiple />
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
