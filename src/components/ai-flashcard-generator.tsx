'use client';

import { useState } from 'react';
import { generateFlashcardsWithAI } from '@/actions/ai-actions';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Protect } from '@clerk/nextjs';
import { toast } from 'sonner';

interface AIFlashcardGeneratorProps {
  deckId: number;
  deckTitle: string;
  deckDescription?: string | null;
}

function AIGenerationUpgradePrompt() {
  return (
    <Button variant="outline" className="gap-1" asChild>
      <a href="/pricing">
        ✨ AI Generate
        <Badge variant="secondary" className="text-xs h-4 px-1">Pro</Badge>
      </a>
    </Button>
  );
}

function AIGenerationForm({ 
  deckId, 
  deckTitle, 
  deckDescription 
}: AIFlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    
    try {
      const result = await generateFlashcardsWithAI({
        deckId,
        topic: deckTitle,
        count: 20,
        difficulty: 'medium'
      });

      if (result.success) {
        toast.success(`Successfully generated ${result.count} flashcards!`);
      } else if (result.requiresUpgrade) {
        toast.error('AI generation requires a Pro subscription');
        // Redirect to pricing page
        window.location.href = '/pricing';
      } else if (result.requiresSetup) {
        toast.error('AI generation is temporarily unavailable. Please try again later.');
        console.error('Setup required:', result.error);
      } else {
        toast.error(result.error || 'Failed to generate flashcards. Please try again.');
        console.error('Generation error:', result.error);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button 
      onClick={handleGenerate}
      disabled={isGenerating}
      variant="outline"
      className="gap-1"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          Generating...
        </>
      ) : (
        <>
          ✨ AI Generate
          <Badge variant="secondary" className="text-xs h-4 px-1">Pro</Badge>
        </>
      )}
    </Button>
  );
}

export function AIFlashcardGenerator(props: AIFlashcardGeneratorProps) {
  return (
    <Protect
      feature="ai_flashcard_generation"
      fallback={<AIGenerationUpgradePrompt />}
    >
      <AIGenerationForm {...props} />
    </Protect>
  );
}