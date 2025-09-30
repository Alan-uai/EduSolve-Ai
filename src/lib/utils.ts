import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function markdownToHtml(text: string): string {
  // Bold (**text** or __text__)
  text = text.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  
  // Italic (*text* or _text_)
  text = text.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');

  // Headers (###, ##, #)
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Unordered list (* item)
  text = text.replace(/^\s*\*[ \t]+(.*)/gim, '<ul>\n<li>$1</li>\n</ul>');
  // Handle adjacent list items
  text = text.replace(/<\/ul>\n<ul>/g, '');

  // Horizontal Rule (---)
  text = text.replace(/^-{3,}\s*$/gim, '<hr class="my-4" />');

  // Paragraphs (and line breaks)
  text = text.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

  return text;
}
