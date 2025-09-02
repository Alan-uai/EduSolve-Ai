import { ProblemForm } from '@/components/app/problem-form';
import { BrainCircuit } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3">
            <BrainCircuit className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight">
              Castanha
            </h1>
          </div>
          <p className="text-muted-foreground mt-3 text-lg">
            Your AI-powered homework helper for math and science.
          </p>
        </header>
        
        <ProblemForm />

        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Castanha. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
