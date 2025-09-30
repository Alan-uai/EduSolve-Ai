
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function markdownToHtml(text: string): string {
  let html = text;
  
  // Headers (###, ##, #)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  
  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');

  // Unordered list (* item) - more robustly
  html = html.replace(/^\s*[\-\*]\s+(.*)/gm, (match, content) => {
    return `<li>${content}</li>`;
  });
  html = html.replace(/(\<\/li\>)\s*\<li\>/g, '$1</li><li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');


  // Horizontal Rule (---) is handled by splitting now, but we can remove it from the final html
  html = html.replace(/^-{3,}\s*$/gim, '');

  // Paragraphs and line breaks
  // First, trim whitespace from the start and end of the html
  html = html.trim();
  // Then, handle line breaks within paragraphs
  html = html.replace(/\n/g, '<br>');

  return html;
}

    