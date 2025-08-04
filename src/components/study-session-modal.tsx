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
  const [isPaused, setIsPaused] = useState(false);
  const [skippedCards, setSkippedCards] = useState<Set<number>>(new Set());
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<number>>(new Set());
  const [wrongCards, setWrongCards] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(0);

  // Prepare cards based on mode
  useEffect(() => {
    if (isOpen && cards.length > 0) {
      // eslint-disable-next-line prefer-const
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

  // Timer for timed mode
  useEffect(() => {
    if (mode === 'timed' && sessionId && !sessionCompleted && !isPaused && showAnswer) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto advance to next card when time runs out
            handleCardReview('medium'); // Default to medium if time runs out
            return 30; // Reset timer
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [mode, sessionId, sessionCompleted, isPaused, showAnswer]);

  // Total time tracker
  useEffect(() => {
    if (sessionId && !sessionCompleted && !isPaused) {
      const timer = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionId, sessionCompleted, isPaused]);

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

  const handleCardReview = async (difficulty: 'easy' | 'medium' | 'hard' | 'incorrect') => {
    if (!sessionId || currentCardIndex >= studyCards.length) return;

    setIsLoading(true);
    try {
      const currentCard = studyCards[currentCardIndex];
      const isCorrect = difficulty !== 'incorrect';
      
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
      } else {
        setWrongCards(prev => new Set([...prev, currentCard.id]));
      }

      // Move to next card or complete session
      if (currentCardIndex < studyCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
        setTimeLeft(30);
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
    setIsPaused(false);
    setSkippedCards(new Set());
    setBookmarkedCards(new Set());
    setWrongCards(new Set());
    setTimeLeft(30);
    setTotalTime(0);
  };

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setShowAnswer(false);
      setTimeLeft(30);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
      setTimeLeft(30);
    }
  };

  const skipCard = () => {
    setSkippedCards(prev => new Set([...prev, studyCards[currentCardIndex].id]));
    goToNextCard();
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const toggleBookmark = () => {
    const currentCardId = studyCards[currentCardIndex].id;
    setBookmarkedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentCardId)) {
        newSet.delete(currentCardId);
      } else {
        newSet.add(currentCardId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-yellow-500';
    return 'text-green-500';
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
                  {skippedCards.size > 0 && <span className="text-yellow-600">Skipped: {skippedCards.size}</span>}
                  {mode === 'timed' && showAnswer && <span className={getTimerColor()}>Time: {timeLeft}s</span>}
                  <span className="text-muted-foreground">Total: {formatTime(totalTime)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                {mode === 'timed' && showAnswer && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Time left:</span>
                    <Progress 
                      value={(timeLeft / 30) * 100} 
                      className={`h-1 flex-1 ${timeLeft <= 5 ? 'bg-red-100' : timeLeft <= 10 ? 'bg-yellow-100' : 'bg-green-100'}`}
                    />
                    <span className={`text-xs font-bold ${getTimerColor()}`}>
                      {timeLeft}s
                    </span>
                  </div>
                )}
              </div>
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
                  {isLoading ? 'Starting...' : 'Study'}
                </Button>
              </div>
            </div>
          )}

          {/* Study Card */}
          {sessionId && !sessionCompleted && currentCard && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-4 w-full justify-between">
                <Button
                  onClick={goToPreviousCard}
                  disabled={currentCardIndex === 0 || isPaused}
                  variant="outline"
                  size="sm"
                >
                  ← Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    Card {currentCardIndex + 1} of {studyCards.length}
                  </Badge>
                  {bookmarkedCards.has(studyCards[currentCardIndex]?.id) && (
                    <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                      🔖 Bookmarked
                    </Badge>
                  )}
                  {isPaused && (
                    <Badge variant="secondary" className="text-sm">
                      ⏸️ Paused
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={goToNextCard}
                  disabled={currentCardIndex === studyCards.length - 1 || isPaused}
                  variant="outline"
                  size="sm"
                >
                  Next →
                </Button>
              </div>

              {/* Control Panel */}
              {!isPaused && (
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={toggleBookmark}
                    variant={bookmarkedCards.has(studyCards[currentCardIndex]?.id) ? "default" : "outline"}
                    size="sm"
                    disabled={isLoading}
                  >
                    🔖 {bookmarkedCards.has(studyCards[currentCardIndex]?.id) ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  <Button
                    onClick={skipCard}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={togglePause}
                    variant="outline"
                    size="sm"
                  >
                    Pause
                  </Button>
                </div>
              )}
              
              {/* Pause Overlay */}
              {isPaused ? (
                <Card className="w-full max-w-2xl min-h-[300px] border-2 border-dashed border-muted-foreground/50">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-4xl">⏸️</div>
                    <h3 className="text-xl font-bold">Study Session Paused</h3>
                    <p className="text-muted-foreground mb-4">
                      Take a break! Click Resume when you&apos;re ready to continue.
                    </p>
                    <Button onClick={togglePause} size="lg">
                      Resume Study
                    </Button>
                  </CardContent>
                </Card>
              ) : (
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
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={() => handleCardReview('easy')}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-sm"
                          >
                            😊 Easy
                          </Button>
                          <Button 
                            onClick={() => handleCardReview('medium')}
                            disabled={isLoading}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-sm"
                          >
                            🤔 Medium
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={() => handleCardReview('hard')}
                            disabled={isLoading}
                            variant="outline"
                            className="px-4 py-2 border-orange-600 text-orange-600 hover:bg-orange-50 text-sm"
                          >
                            😰 Hard
                          </Button>
                          <Button 
                            onClick={() => handleCardReview('incorrect')}
                            disabled={isLoading}
                            variant="outline"
                            className="px-4 py-2 border-red-600 text-red-600 hover:bg-red-50 text-sm"
                          >
                            ❌ Wrong
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                </Card>
              )}
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
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                      <div className="text-muted-foreground">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{cardsAnswered - correctAnswers}</div>
                      <div className="text-muted-foreground">Incorrect</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                      <div className="text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{skippedCards.size}</div>
                      <div className="text-muted-foreground">Skipped</div>
                    </div>
                  </div>
                  <div className="text-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Total Study Time: <span className="text-foreground font-medium">{formatTime(totalTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button variant="outline" onClick={closeModal}>
                    Back to Deck
                  </Button>
                  <Button onClick={resetSession}>
                    Study Again
                  </Button>
                  {wrongCards.size > 0 && (
                    <Button 
                      onClick={() => {
                        const wrongCardsList = studyCards.filter(card => wrongCards.has(card.id));
                        setStudyCards(wrongCardsList);
                        resetSession();
                        handleStartSession();
                      }}
                      variant="secondary"
                    >
                      Review Wrong Cards ({wrongCards.size})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}