'use client';

import { useState } from 'react';
import { generateFlashcardsWithAI } from '@/actions/ai-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Protect } from '@clerk/nextjs';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

import { InfoIcon, Settings } from 'lucide-react';
import { EditDeckModal } from './edit-deck-modal';

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

function AIGenerationDescriptionRequired({ 
  deckId, 
  deckTitle, 
  deckDescription 
}: { 
  deckId: number; 
  deckTitle: string; 
  deckDescription?: string | null; 
}) {
  return (
    <EditDeckModal 
      deck={{
        id: deckId,
        title: deckTitle,
        description: deckDescription || null
      }}
      triggerButton={
        <Button variant="outline" className="gap-1">
          <InfoIcon className="h-4 w-4" />
          Add Description
        </Button>
      }
    />
  );
}

function AIGenerationForm({ 
  deckId, 
  deckTitle, 
  deckDescription 
}: AIFlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state
  const [topic, setTopic] = useState(deckTitle);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [cardType, setCardType] = useState<'general' | 'language' | 'vocabulary' | 'definitions'>('general');
  const [sourceLanguage, setSourceLanguage] = useState('português');
  const [targetLanguage, setTargetLanguage] = useState('inglês');

  async function handleGenerate() {
    setIsGenerating(true);
    
    try {
      const result = await generateFlashcardsWithAI({
        deckId,
        topic,
        count,
        difficulty,
        cardType,
        sourceLanguage,
        targetLanguage,
      });

      if (result.success) {
        toast.success(`Generated ${result.count} flashcards successfully!`);
        setIsOpen(false);
      } else if (result.requiresUpgrade) {
        toast.error('AI generation requires a Pro subscription');
        window.location.href = '/pricing';
      } else if (result.requiresDescription) {
        toast.error(result.error);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          ✨ AI Generate
          <Badge variant="secondary" className="text-xs h-4 px-1">Pro</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Flashcards with AI</DialogTitle>
          <DialogDescription>
            Configure your AI flashcard generation settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic or theme"
              maxLength={500}
            />
          </div>
          
          {/* Card Type */}
          <div className="space-y-2">
            <Label htmlFor="cardType">Card Type</Label>
            <select
              id="cardType"
              value={cardType}
              onChange={(e) => setCardType(e.target.value as typeof cardType)}
              className="w-full p-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="general">General Questions</option>
              <option value="language">Language Learning</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="definitions">Definitions</option>
            </select>
          </div>
          
          {/* Language fields - only show if cardType is 'language' */}
          {cardType === 'language' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sourceLanguage">Source Language (front of card)</Label>
                <Input
                  id="sourceLanguage"
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  placeholder="e.g. português, english, español"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetLanguage">Target Language (back of card)</Label>
                <Input
                  id="targetLanguage"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  placeholder="e.g. english, français, deutsch"
                />
              </div>
            </>
          )}
          
          {/* Count and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Quantity</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="w-full p-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Generating...
              </>
            ) : (
              `Generate ${count} Flashcards`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AIFlashcardGenerator(props: AIFlashcardGeneratorProps) {
  const { deckId, deckTitle, deckDescription } = props;
  
  // Check if deck has description
  const hasDescription = deckDescription && deckDescription.trim().length > 0;
  
  return (
    <Protect
      feature="ai_flashcard_generation"
      fallback={<AIGenerationUpgradePrompt />}
    >
      {hasDescription ? (
        <AIGenerationForm {...props} />
      ) : (
        <AIGenerationDescriptionRequired 
          deckId={deckId} 
          deckTitle={deckTitle}
          deckDescription={deckDescription}
        />
      )}
    </Protect>
  );
}