'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { startStudySession, reviewCard, completeStudySession } from '@/actions/study-actions';

interface StudyCard {
  id: number;
  front: string;
  back: string;
}

interface StudySessionModalProps {
  deckId: number;
  cards: StudyCard[];
  triggerButton: ReactNode;
  mode?: 'standard' | 'shuffle' | 'timed';
}

export function StudySessionModal({ deckId, cards, triggerButton, mode = 'standard' }: StudySessionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [cardsAnswered, setCardsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Prepare cards based on mode
  useEffect(() => {
    if (isOpen && cards.length > 0) {
      let arrangedCards = [...cards];
      
      if (mode === 'shuffle') {
        // Fisher-Yates shuffle algorithm
        for (let i = arrangedCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arrangedCards[i], arrangedCards[j]] = [arrangedCards[j], arrangedCards[i]];
        }
      }
      
      setStudyCards(arrangedCards);
    }
  }, [isOpen, cards, mode]);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const result = await startStudySession({ deckId, mode });
      
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        setCurrentCardIndex(0);
        setShowAnswer(false);
        setCorrectAnswers(0);
        setCardsAnswered(0);
        setSessionCompleted(false);
      } else {
        console.error('Failed to start session:', result.error);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardReview = async (isCorrect: boolean) => {
    if (!sessionId || currentCardIndex >= studyCards.length) return;

    setIsLoading(true);
    try {
      const currentCard = studyCards[currentCardIndex];
      await reviewCard({
        sessionId,
        cardId: currentCard.id,
        deckId,
        isCorrect,
      });

      // Increment cards answered count
      setCardsAnswered(prev => prev + 1);

      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
      }

      // Move to next card or complete session
      if (currentCardIndex < studyCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Complete the session
        await completeStudySession({ sessionId, deckId });
        setSessionCompleted(true);
      }
    } catch (error) {
      console.error('Error reviewing card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setSessionId(null);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(0);
    setCardsAnswered(0);
    setSessionCompleted(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(resetSession, 300); // Reset after modal closes
  };

  const currentCard = studyCards[currentCardIndex];
  const progress = studyCards.length > 0 ? (cardsAnswered / studyCards.length) * 100 : 0;
  const accuracy = cardsAnswered > 0 ? Math.round((correctAnswers / cardsAnswered) * 100) : 0;

  const getModeIcon = () => {
    switch (mode) {
      case 'shuffle': return '🔀';
      case 'timed': return '⏱️';
      default: return '📖';
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'shuffle': return 'Random Shuffle';
      case 'timed': return 'Timed Challenge';
      default: return 'Standard Review';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getModeIcon()}</span>
            Study Session - {getModeLabel()}
          </DialogTitle>
          <DialogDescription>
            {!sessionId && 'Ready to start your study session?'}
            {sessionId && !sessionCompleted && `Card ${currentCardIndex + 1} of ${studyCards.length}`}
            {sessionCompleted && 'Study session completed!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Progress Bar */}
          {sessionId && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Progress</span>
                <div className="flex gap-4 text-sm">
                  <span>Progress: {cardsAnswered}/{studyCards.length}</span>
                  <span>Accuracy: {accuracy}%</span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Start Session */}
          {!sessionId && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="text-6xl">{getModeIcon()}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{getModeLabel()}</h3>
                  <p className="text-muted-foreground mb-6">
                    You&apos;re about to study {cards.length} flashcard{cards.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleStartSession}
                  disabled={isLoading || cards.length === 0}
                  className="px-8"
                >
                  {isLoading ? 'Starting...' : 'Start Study Session'}
                </Button>
              </div>
            </div>
          )}

          {/* Study Card */}
          {sessionId && !sessionCompleted && currentCard && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <Badge variant="outline" className="text-sm">
                Card {currentCardIndex + 1} of {studyCards.length}
              </Badge>

              <Card className="w-full max-w-2xl min-h-[300px] border-2">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                  {!showAnswer ? (
                    <>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="text-xs">Question</Badge>
                        <p className="text-xl font-medium leading-relaxed">
                          {currentCard.front}
                        </p>
                      </div>
                      <Button 
                        onClick={() => setShowAnswer(true)}
                        variant="outline"
                        size="lg"
                      >
                        Show Answer
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-xs">Question</Badge>
                          <p className="text-lg text-muted-foreground">
                            {currentCard.front}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="default" className="text-xs">Answer</Badge>
                          <p className="text-xl font-medium leading-relaxed">
                            {currentCard.back}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => handleCardReview(false)}
                          variant="outline"
                          disabled={isLoading}
                          className="px-6"
                        >
                          ❌ Incorrect
                        </Button>
                        <Button 
                          onClick={() => handleCardReview(true)}
                          disabled={isLoading}
                          className="px-6"
                        >
                          ✅ Correct
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Session Completed */}
          {sessionCompleted && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="text-6xl">🎉</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Study Session Complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    Great job! You&apos;ve completed your study session.
                  </p>
                  <div className="flex justify-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{correctAnswers}</div>
                      <div className="text-muted-foreground">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{cardsAnswered - correctAnswers}</div>
                      <div className="text-muted-foreground">Incorrect</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{accuracy}%</div>
                      <div className="text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={closeModal}>
                    Back to Deck
                  </Button>
                  <Button onClick={resetSession}>
                    Study Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}