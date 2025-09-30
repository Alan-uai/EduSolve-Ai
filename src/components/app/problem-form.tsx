"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Camera, Type, MessageSquare, LoaderCircle, WandSparkles, X, Paperclip, Send } from "lucide-react";
import { generateSolution, generateChatResponse } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/ai/flows/chat-flow";
import { SolutionDisplay } from "./solution-display";
import { ChatDisplay } from "./chat-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";


type SolveState = {
  solution?: string;
  error?: string;
};

type ChatState = {
  response?: string;
  error?: string;
}

export function ProblemForm() {
  const { toast } = useToast();
  const [isSolving, startSolving] = useTransition();
  const [isChatting, startChatting] = useTransition();
  const [solveState, setSolveState] = useState<SolveState>({});
  const [activeTab, setActiveTab] = useState("scan");

  // State for problem solving tabs
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [problemText, setProblemText] = useState("");
  
  // State for chat tab
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatImageFiles, setChatImageFiles] = useState<File[]>([]);
  const [chatImagePreviews, setChatImagePreviews] = useState<string[]>([]);


  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

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

  const handleChatFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const newFiles = [...chatImageFiles, ...files];
      setChatImageFiles(newFiles);

      const newPreviews = [...chatImagePreviews];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          setChatImagePreviews([...newPreviews]);
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

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeChatImage = (index: number) => {
    const newFiles = [...chatImageFiles];
    newFiles.splice(index, 1);
    setChatImageFiles(newFiles);

    const newPreviews = [...chatImagePreviews];
    newPreviews.splice(index, 1);
    setChatImagePreviews(newPreviews);

    if (chatInputRef.current) {
      chatInputRef.current.value = "";
    }
  }


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

  const handleSolveSubmit = async () => {
    setSolveState({}); 

    startSolving(async () => {
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
      setSolveState(result);
    });
  };

  const handleChatSubmit = async () => {
    if (chatImageFiles.length === 0 && !chatPrompt.trim()) {
      toast({ variant: "destructive", title: "Empty message", description: "Please enter a message or upload an image." });
      return;
    }

    const currentUserPrompt = chatPrompt;
    const currentImagePreviews = chatImagePreviews;
    const userMessageContent: any[] = [{ text: currentUserPrompt }];
    currentImagePreviews.forEach(url => userMessageContent.push({ media: { url } }));
    
    setChatHistory(prev => [...prev, { role: 'user', content: userMessageContent }]);
    setChatPrompt("");
    setChatImageFiles([]);
    setChatImagePreviews([]);

    startChatting(async () => {
      try {
        const dataUris = await filesToDataUris(chatImageFiles);
        const result = await generateChatResponse(chatHistory, currentUserPrompt, dataUris);
        
        if (result.error) {
          toast({ variant: "destructive", title: "AI Error", description: result.error });
          const errorMessage: ChatMessage = { role: 'model', content: [{ text: `Error: ${result.error}` }] };
          setChatHistory(prev => [...prev, errorMessage]);
        }
        if (result.response) {
          const modelMessage: ChatMessage = { role: 'model', content: [{ text: result.response }] };
          setChatHistory(prev => [...prev, modelMessage]);
        }
      } catch (error) {
        const description = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: "destructive", title: "Error processing chat", description });
        const errorMessage: ChatMessage = { role: 'model', content: [{ text: `Error: ${description}` }] };
        setChatHistory(prev => [...prev, errorMessage]);
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeTab === "chat") {
      handleChatSubmit();
    } else {
      handleSolveSubmit();
    }
  }

  const isPending = isSolving || isChatting;

  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="scan" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan">
            <Camera className="mr-2 h-4 w-4" /> Scan
          </TabsTrigger>
          <TabsTrigger value="type">
            <Type className="mr-2 h-4 w-4" /> Type
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" /> Chat
          </TabsTrigger>
        </TabsList>
        
        <form ref={formRef} onSubmit={handleSubmit}>
          <TabsContent value="scan" className="m-0">
            <Card>
              <CardContent className="p-6 flex flex-col gap-6">
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
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeImage(index); }}
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
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                        </div>
                      )}
                    </Label>
                    <Input ref={inputRef} id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} multiple />
                  </div>
                  <Button type="submit" disabled={isSolving} className="w-full font-bold text-lg py-6">
                    {isSolving ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Solving...</>
                               : <><WandSparkles className="mr-2 h-5 w-5" /> Generate Solution</>}
                  </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="type" className="m-0">
             <Card>
              <CardContent className="p-6 flex flex-col gap-6">
                <Textarea
                    placeholder="For example: what is 2x + 5 = 15?"
                    className="min-h-[192px] text-base"
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                  />
                  <Button type="submit" disabled={isSolving} className="w-full font-bold text-lg py-6">
                    {isSolving ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Solving...</>
                               : <><WandSparkles className="mr-2 h-5 w-5" /> Generate Solution</>}
                  </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chat" className="m-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col h-[60vh]">
                  <ChatDisplay history={chatHistory} isLoading={isChatting} />
                  <div className="mt-4 border-t pt-4">
                    {chatImagePreviews.length > 0 && (
                        <div className="mb-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {chatImagePreviews.map((src, index) => (
                            <div key={index} className="relative group">
                              <Image src={src} alt={`Chat preview ${index + 1}`} width={80} height={80} className="rounded-lg object-cover aspect-square"/>
                              <button type="button" onClick={() => removeChatImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                                <X className="h-2 w-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    <div className="relative">
                      <Textarea
                        placeholder="Ask a follow-up question or start a new topic..."
                        className="pr-24"
                        value={chatPrompt}
                        onChange={(e) => setChatPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <Button type="button" size="icon" variant="ghost" asChild>
                          <Label htmlFor="chat-image-upload">
                            <Paperclip className="h-5 w-5" />
                            <span className="sr-only">Attach image</span>
                          </Label>
                        </Button>
                        <Input ref={chatInputRef} id="chat-image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleChatFileChange} multiple />
                        <Button type="submit" size="icon" variant="ghost" disabled={isChatting}>
                          <Send className="h-5 w-5" />
                          <span className="sr-only">Send</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
      
      {activeTab !== 'chat' && (
         <SolutionDisplay
          isLoading={isSolving}
          solution={solveState.solution}
          error={solveState.error}
        />
      )}
    </div>
  );
}
