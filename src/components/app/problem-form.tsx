
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, Type, MessageSquare, LoaderCircle, WandSparkles, X, Paperclip, Send, Trash2 } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const LOCAL_STORAGE_KEY = 'castanha-state';

type AppState = {
  activeTab: string;
  solveState: { solution?: string; error?: string };
  imagePreviews: string[];
  problemText: string;
  chatHistory: ChatMessage[];
};

export function ProblemForm() {
  const { toast } = useToast();
  const [isSolving, startSolving] = useTransition();
  const [isChatting, startChatting] = useTransition();
  
  const [appState, setAppState] = useState<AppState>({
    activeTab: "scan",
    solveState: {},
    imagePreviews: [],
    problemText: "",
    chatHistory: [],
  });

  // Derived state for easier access
  const { activeTab, solveState, imagePreviews, problemText, chatHistory } = appState;
  
  const setActiveTab = (tab: string) => setAppState(prev => ({ ...prev, activeTab: tab }));
  const setSolveState = (state: { solution?: string; error?: string }) => setAppState(prev => ({ ...prev, solveState: state }));
  const setImagePreviews = (previews: string[] | ((prev: string[]) => string[])) => setAppState(prev => ({ ...prev, imagePreviews: typeof previews === 'function' ? previews(prev.imagePreviews) : previews }));
  const setProblemText = (text: string) => setAppState(prev => ({ ...prev, problemText: text }));
  const setChatHistory = (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => setAppState(prev => ({ ...prev, chatHistory: typeof history === 'function' ? history(prev.chatHistory) : history }));


  // State for things that shouldn't be persisted
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatImageFiles, setChatImageFiles] = useState<File[]>([]);
  const [chatImagePreviews, setChatImagePreviews] = useState<string[]>([]);
  

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setAppState(parsedState);
        // Re-create File objects from data URIs if needed for re-submission, but for now just previews are restored.
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
      // Don't save if initial state is still loading
      if(appState.activeTab === 'scan' && appState.imagePreviews.length === 0 && appState.problemText === '' && appState.chatHistory.length === 0) {
        // This is a rough check for initial state, could be improved.
      } else {
        const stateToSave = JSON.stringify(appState);
        localStorage.setItem(LOCAL_STORAGE_KEY, stateToSave);
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [appState]);


  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const newFiles = [...imageFiles, ...files];
      setImageFiles(newFiles);

      const newPreviews: string[] = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
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

      const newPreviews: string[] = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setChatImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    // Also remove the corresponding file if you are tracking them separately
    setImageFiles(prev => prev.filter((_, i) => i !== index));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeChatImage = (index: number) => {
    setChatImagePreviews(prev => prev.filter((_, i) => i !== index));
    setChatImageFiles(prev => prev.filter((_, i) => i !== index));
    
    if (chatInputRef.current) {
      chatInputRef.current.value = "";
    }
  }

  const handleNewChat = () => {
    setChatHistory([]);
    setChatPrompt("");
    setChatImageFiles([]);
    setChatImagePreviews([]);
    toast({
      title: "Novo Chat Criado",
      description: "Seu histórico de chat anterior foi limpo.",
    });
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
        if (imagePreviews.length === 0) {
          toast({ variant: "destructive", title: "Nenhuma imagem selecionada", description: "Por favor, envie pelo menos uma imagem do problema." });
          return;
        }
        // Using previews directly as they are data URIs
        result = await generateSolution({ problemImages: imagePreviews });

      } else { // "type" tab
        if (!problemText.trim()) {
          toast({ variant: "destructive", title: "Nenhum texto inserido", description: "Por favor, digite o problema na área de texto." });
          return;
        }
        result = await generateSolution({ problemText: problemText });
      }

      if (result.error) {
        toast({ variant: "destructive", title: "Erro da IA", description: result.error });
      }
      setSolveState(result);
    });
  };

  const handleChatSubmit = async () => {
    if (chatImagePreviews.length === 0 && !chatPrompt.trim()) {
      toast({ variant: "destructive", title: "Mensagem vazia", description: "Por favor, insira uma mensagem ou envie uma imagem." });
      return;
    }

    const currentUserPrompt = chatPrompt;
    const currentImagePreviews = chatImagePreviews;
    const userMessageContent: any[] = [{ text: currentUserPrompt }];
    currentImagePreviews.forEach(url => userMessageContent.push({ media: { url } }));

    const newUserMessage: ChatMessage = { role: 'user', content: userMessageContent };
    const newHistory = [...chatHistory, newUserMessage];
    
    setChatHistory(newHistory);
    setChatPrompt("");
    setChatImageFiles([]);
    setChatImagePreviews([]);

    startChatting(async () => {
      try {
        // We use the previews (data URIs) directly for the AI call.
        const result = await generateChatResponse(newHistory, currentUserPrompt, currentImagePreviews);
        
        if (result.error) {
          toast({ variant: "destructive", title: "Erro da IA", description: result.error });
          const errorMessage: ChatMessage = { role: 'model', content: [{ text: `Erro: ${result.error}` }] };
          setChatHistory(prev => [...prev, errorMessage]);
        }
        if (result.response) {
          const modelMessage: ChatMessage = { role: 'model', content: [{ text: result.response }] };
          setChatHistory(prev => [...prev, modelMessage]);
        }
      } catch (error) {
        const description = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        toast({ variant: "destructive", title: "Erro ao processar chat", description });
        const errorMessage: ChatMessage = { role: 'model', content: [{ text: `Erro: ${description}` }] };
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
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan">
            <Camera className="mr-2 h-4 w-4" /> Escanear
          </TabsTrigger>
          <TabsTrigger value="type">
            <Type className="mr-2 h-4 w-4" /> Digitar
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
                                alt={`Prévia do problema ${index + 1}`}
                                width={150}
                                height={150}
                                className="rounded-lg object-cover aspect-square"
                              />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeImage(index); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remover imagem"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, ou WEBP</p>
                        </div>
                      )}
                    </Label>
                    <Input ref={inputRef} id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} multiple />
                  </div>
                  <Button type="submit" disabled={isSolving} className="w-full font-bold text-lg py-6">
                    {isSolving ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Resolvendo...</>
                               : <><WandSparkles className="mr-2 h-5 w-5" /> Gerar Solução</>}
                  </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="type" className="m-0">
             <Card>
              <CardContent className="p-6 flex flex-col gap-6">
                <Textarea
                    placeholder="Por exemplo: qual é a resposta para 2x + 5 = 15?"
                    className="min-h-[192px] text-base"
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                  />
                  <Button type="submit" disabled={isSolving} className="w-full font-bold text-lg py-6">
                    {isSolving ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Resolvendo...</>
                               : <><WandSparkles className="mr-2 h-5 w-5" /> Gerar Solução</>}
                  </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chat" className="m-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col h-[60vh]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Chat com IA</h3>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm" disabled={chatHistory.length === 0}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Novo Chat
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                           <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                 Esta ação não pode ser desfeita. Isso limpará permanentemente seu histórico de bate-papo atual.
                              </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleNewChat}>Continuar</AlertDialogAction>
                           </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                  </div>

                  <ChatDisplay history={chatHistory} isLoading={isChatting} />
                  
                  <div className="mt-4 border-t pt-4">
                    {chatImagePreviews.length > 0 && (
                        <div className="mb-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {chatImagePreviews.map((src, index) => (
                            <div key={index} className="relative group">
                              <Image src={src} alt={`Prévia do chat ${index + 1}`} width={80} height={80} className="rounded-lg object-cover aspect-square"/>
                              <button type="button" onClick={() => removeChatImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remover imagem">
                                <X className="h-2 w-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    <div className="relative">
                      <Textarea
                        placeholder="Faça uma pergunta ou inicie um novo tópico..."
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
                            <span className="sr-only">Anexar imagem</span>
                          </Label>
                        </Button>
                        <Input ref={chatInputRef} id="chat-image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleChatFileChange} multiple />
                        <Button type="submit" size="icon" variant="ghost" disabled={isChatting}>
                          <Send className="h-5 w-5" />
                          <span className="sr-only">Enviar</span>
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
