'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface StudyPageContentProps {
  deckId: number;
  cards: StudyCard[];
  mode: 'standard' | 'shuffle' | 'timed';
}

export function StudyPageContent({ deckId, cards, mode }: StudyPageContentProps) {
  const router = useRouter();
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
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per card in timed mode
  const [totalTime, setTotalTime] = useState(0);

  // Prepare cards based on mode
  useEffect(() => {
    if (cards.length > 0) {
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
  }, [cards, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!sessionId || sessionCompleted || isPaused) return;

      // Prevent default for our handled keys
      if (['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyS', 'KeyP'].includes(e.code)) {
        e.preventDefault();
      }

      if (!showAnswer) {
        // Show answer
        if (e.code === 'Space' || e.code === 'Enter') {
          setShowAnswer(true);
        }
      } else {
        // Review card
        switch (e.code) {
          case 'Digit1':
            handleCardReview('easy');
            break;
          case 'Digit2':
            handleCardReview('medium');
            break;
          case 'Digit3':
            handleCardReview('hard');
            break;
          case 'Digit4':
            handleCardReview('incorrect');
            break;
        }
      }

      // Navigation (works always when session is active)
      if (sessionId && !sessionCompleted) {
        switch (e.code) {
          case 'ArrowLeft':
            goToPreviousCard();
            break;
          case 'ArrowRight':
            goToNextCard();
            break;
          case 'KeyS':
            skipCard();
            break;
          case 'KeyP':
            togglePause();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [sessionId, sessionCompleted, showAnswer, isPaused, currentCardIndex, studyCards.length]);

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
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
      setTimeLeft(30); // Reset timer for next card
    }
  };

  const skipCard = () => {
    setSkippedCards(prev => new Set([...prev, studyCards[currentCardIndex].id]));
    goToNextCard();
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

  const restartWithWrongCards = () => {
    const wrongCardsList = studyCards.filter(card => wrongCards.has(card.id));
    if (wrongCardsList.length > 0) {
      setStudyCards(wrongCardsList);
      resetSession();
      handleStartSession();
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const goBackToDeck = () => {
    router.push(`/decks/${deckId}`);
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getModeIcon()}</span>
              <div>
                <h2 className="text-xl font-bold">{getModeLabel()}</h2>
                <p className="text-muted-foreground">
                  {!sessionId && 'Ready to start your study session?'}
                  {sessionId && !sessionCompleted && `Card ${currentCardIndex + 1} of ${studyCards.length}`}
                  {sessionCompleted && 'Study session completed!'}
                </p>
              </div>
            </div>
            {sessionId && (
              <div className="text-right text-sm space-y-1">
                <div>Progress: {cardsAnswered}/{studyCards.length}</div>
                <div>Accuracy: {accuracy}%</div>
                {mode === 'timed' && showAnswer && (
                  <div className={`font-bold ${getTimerColor()}`}>
                    Time: {timeLeft}s
                  </div>
                )}
                <div className="text-muted-foreground">
                  Total: {formatTime(totalTime)}
                </div>
                {skippedCards.size > 0 && (
                  <div className="text-yellow-600">Skipped: {skippedCards.size}</div>
                )}
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {sessionId && (
            <div className="mt-4 space-y-2">
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
          )}
        </CardContent>
      </Card>
      
      {/* Keyboard Shortcuts Help */}
      {sessionId && !sessionCompleted && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <span className="font-medium">Keyboard Shortcuts:</span>
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-xs">Space</kbd> Show Answer
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-xs">1-4</kbd> Rate Difficulty
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-xs">←→</kbd> Navigate
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-xs">S</kbd> Skip
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-xs">P</kbd> Pause
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="min-h-[400px]">
        {/* Start Session */}
        {!sessionId && (
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="text-6xl">{getModeIcon()}</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{getModeLabel()}</h3>
                <p className="text-muted-foreground mb-6">
                  You&apos;re about to study {cards.length} flashcard{cards.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="outline"
                  onClick={goBackToDeck}
                >
                  Back to Deck
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleStartSession}
                  disabled={isLoading || cards.length === 0}
                  className="px-8"
                >
                  {isLoading ? 'Starting...' : 'Start Studying'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Study Card */}
        {sessionId && !sessionCompleted && currentCard && (
          <div className="space-y-6">
            {/* Navigation and Card Info */}
            <div className="flex items-center justify-between">
              <Button
                onClick={goToPreviousCard}
                disabled={currentCardIndex === 0 || isPaused}
                variant="outline"
                size="sm"
              >
                ← Previous <kbd className="ml-1 px-1 py-0.5 text-xs bg-black/20 rounded">←</kbd>
              </Button>
              
              <div className="flex items-center gap-4">
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
                Next → <kbd className="ml-1 px-1 py-0.5 text-xs bg-black/20 rounded">→</kbd>
              </Button>
            </div>

            {/* Pause Overlay */}
            {isPaused && (
              <Card className="border-2 border-dashed border-muted-foreground/50">
                <CardContent className="p-12 text-center space-y-4">
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
            )}
            
            {/* Study Card */}
            {!isPaused && (
              <Card className="min-h-[400px] border-2">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-8">
                {!showAnswer ? (
                  <>
                    <div className="space-y-4">
                      <Badge variant="secondary" className="text-xs">Question</Badge>
                      <p className="text-2xl font-medium leading-relaxed max-w-2xl">
                        {currentCard.front}
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowAnswer(true)}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      Show Answer <kbd className="ml-2 px-1 py-0.5 text-xs bg-black/20 rounded">Space</kbd>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="text-xs">Question</Badge>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                          {currentCard.front}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Badge variant="default" className="text-xs">Answer</Badge>
                        <p className="text-2xl font-medium leading-relaxed max-w-2xl">
                          {currentCard.back}
                        </p>
                      </div>
                    </div>
                                <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleCardReview('easy')}
                  disabled={isLoading}
                  size="lg"
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  <span className="text-lg mr-2">😊</span>
                  Easy <kbd className="ml-2 px-1 py-0.5 text-xs bg-black/20 rounded">1</kbd>
                </Button>
                <Button 
                  onClick={() => handleCardReview('medium')}
                  disabled={isLoading}
                  size="lg"
                  className="px-6 bg-yellow-600 hover:bg-yellow-700"
                >
                  <span className="text-lg mr-2">🤔</span>
                  Medium <kbd className="ml-2 px-1 py-0.5 text-xs bg-black/20 rounded">2</kbd>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleCardReview('hard')}
                  disabled={isLoading}
                  size="lg"
                  variant="outline"
                  className="px-6 border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                >
                  <span className="text-lg mr-2">😰</span>
                  Hard <kbd className="ml-2 px-1 py-0.5 text-xs bg-black/20 rounded">3</kbd>
                </Button>
                <Button 
                  onClick={() => handleCardReview('incorrect')}
                  disabled={isLoading}
                  size="lg"
                  variant="outline"
                  className="px-6 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <span className="text-lg mr-2">❌</span>
                  Incorrect <kbd className="ml-2 px-1 py-0.5 text-xs bg-black/20 rounded">4</kbd>
                </Button>
              </div>
            </div>
                  </>
                )}
                              </CardContent>
              </Card>
            )}
            
            {/* Control Panel */}
            {!isPaused && (
              <div className="flex justify-center gap-4">
                <Button
                  onClick={toggleBookmark}
                  variant={bookmarkedCards.has(studyCards[currentCardIndex]?.id) ? "default" : "outline"}
                  size="sm"
                  disabled={isLoading}
                >
                  {bookmarkedCards.has(studyCards[currentCardIndex]?.id) ? '🔖' : '🔖'} 
                  {bookmarkedCards.has(studyCards[currentCardIndex]?.id) ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button
                  onClick={skipCard}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  Skip <kbd className="ml-1 px-1 py-0.5 text-xs bg-black/20 rounded">S</kbd>
                </Button>
                <Button
                  onClick={togglePause}
                  variant="outline"
                  size="sm"
                >
                  Pause <kbd className="ml-1 px-1 py-0.5 text-xs bg-black/20 rounded">P</kbd>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Session Completed */}
        {sessionCompleted && (
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Study Session Complete!</h3>
                <p className="text-muted-foreground mb-6">
                  Great job! You&apos;ve completed your study session.
                </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{cardsAnswered - correctAnswers}</div>
                  <div className="text-muted-foreground">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                  <div className="text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{skippedCards.size}</div>
                  <div className="text-muted-foreground">Skipped</div>
                </div>
              </div>
              <div className="text-center pt-4 border-t">
                <div className="text-lg font-medium text-muted-foreground">
                  Total Study Time: <span className="text-foreground font-bold">{formatTime(totalTime)}</span>
                </div>
                {mode === 'timed' && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Average time per card: {formatTime(Math.floor(totalTime / cardsAnswered))}
                  </div>
                )}
              </div>
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="outline" onClick={goBackToDeck}>
                  Back to Deck
                </Button>
                <Button onClick={resetSession}>
                  Study Again
                </Button>
                {wrongCards.size > 0 && (
                  <Button onClick={restartWithWrongCards} variant="secondary">
                    Review Wrong Cards ({wrongCards.size})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}