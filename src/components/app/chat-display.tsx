
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { markdownToHtml } from "@/lib/utils";
import type { ChatMessage } from "@/ai/flows/chat-flow";
import { Bot, User, MessageSquare } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface ChatDisplayProps {
  history: ChatMessage[];
  isLoading: boolean;
}

function ChatMessageContent({ message }: { message: ChatMessage }) {
  const isModel = message.role === 'model';
  
  return (
    <div className={`flex items-start gap-3 ${isModel ? '' : 'justify-end'}`}>
       {isModel && (
         <Avatar className="h-8 w-8">
           <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
         </Avatar>
       )}
      <div className={`flex flex-col gap-2 rounded-lg px-3 py-2 text-sm max-w-[85%] ${isModel ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
        {message.content.map((part, index) => {
           if ('text' in part && part.text) {
             return <div key={index} className="prose prose-sm max-w-none text-current whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: markdownToHtml(part.text) }} />
           }
           if ('media' in part) {
            return (
              <div key={index} className="relative mt-1">
                 <Image src={part.media.url} alt="User upload" width={200} height={200} className="rounded-md" />
              </div>
            )
           }
           return null;
        })}
      </div>
      {!isModel && (
         <Avatar className="h-8 w-8">
           <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
         </Avatar>
       )}
    </div>
  )
}

export function ChatDisplay({ history, isLoading }: ChatDisplayProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [history, isLoading]);


  return (
    <div ref={scrollAreaRef} className="flex-1 space-y-4 overflow-y-auto pr-4">
      {history.length === 0 && !isLoading && (
        <div className="text-center text-muted-foreground py-10">
          <MessageSquare className="mx-auto h-12 w-12" />
          <h3 className="mt-2 text-lg font-medium">Inicie uma conversa</h3>
          <p className="mt-1 text-sm">Pergunte-me qualquer coisa sobre sua lição de casa ou envie a imagem de um problema.</p>
        </div>
      )}

      {history.map((message, index) => (
        <ChatMessageContent key={index} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted w-3/4">
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-8/12" />
          </div>
        </div>
      )}
    </div>
  );
}
