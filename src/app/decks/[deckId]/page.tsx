import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getDeckById } from '@/db/queries/decks';
import { getDeckCards } from '@/db/queries/cards';
import { getDeckProgress } from '@/db/queries/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CreateCardModal } from '@/components/create-card-modal';
import { EditDeckModal } from '@/components/edit-deck-modal';
import { EditCardModal } from '@/components/edit-card-modal';
import { StudySessionModal } from '@/components/study-session-modal';

interface DeckPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }

  // Await params in Next.js 15
  const resolvedParams = await params;
  
  // Parse deckId to number
  const deckId = parseInt(resolvedParams.deckId);
  if (isNaN(deckId) || deckId <= 0) {
    notFound();
  }

  let deck: {
    id: number;
    title: string;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  } | undefined;
  let cards: Array<{
    id: number;
    front: string;
    back: string;
    updatedAt: Date | null;
  }> = [];
  let deckProgress: {
    totalCards: number;
    studiedCards: number;
    masteredCards: number;
    averageMastery: number;
    progressPercentage: number;
  } = {
    totalCards: 0,
    studiedCards: 0,
    masteredCards: 0,
    averageMastery: 0,
    progressPercentage: 0,
  };
  let hasError = false;
  
  try {
    // Fetch deck with ownership check
    deck = await getDeckById(deckId, userId);
    
    // If deck doesn't exist, trigger not found
    if (!deck) {
      notFound();
    }
    
    // Fetch cards for this deck
    const cardsResult = await getDeckCards(deckId, userId);
    cards = cardsResult.map(result => result.cards);
    
    // Fetch real progress data
    deckProgress = await getDeckProgress(deckId, userId);
  } catch (error) {
    console.error('Error fetching deck or cards:', error);
    hasError = true;
  }

  if (hasError || !deck) {
    return (
      <div className="min-h-screen p-8">
        <main className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Deck</AlertTitle>
            <AlertDescription>
              {!deck ? 'Deck not found or you do not have permission to view it.' : 'There was an error loading this deck. Please try again later.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Use real progress data - percentage of cards studied
  const studyProgress = deckProgress.progressPercentage;

  return (
    <div className="min-h-screen p-8 bg-background">
      <main className="max-w-6xl mx-auto space-y-8">
        {/* Navigation */}
        <div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Deck Header Section */}
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div>
                  <h1 className="text-4xl font-bold text-foreground tracking-tight">
                    {deck!.title}
                  </h1>
                  {deck!.description && (
                    <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                      {deck!.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: {new Date(deck!.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Updated: {new Date(deck!.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <Badge variant="secondary" className="text-base px-4 py-2 font-semibold">
                  {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </Badge>
                <EditDeckModal
                  deck={{
                    id: deck!.id,
                    title: deck!.title,
                    description: deck!.description,
                  }}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Study Progress Section */}
        <Card className="border border-primary/20 bg-gradient-to-r from-card to-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Study Progress</CardTitle>
                <CardDescription className="mt-1">
                  {deckProgress.studiedCards === 0 
                    ? "Ready to start studying? Let's begin your learning journey!"
                    : studyProgress >= 100
                    ? "Amazing! You've studied all cards in this deck."
                    : studyProgress >= 50
                    ? "Great progress! You're more than halfway through."
                    : "Keep up the great work! You're making excellent progress."
                  }
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {studyProgress}% Studied
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={studyProgress} className="h-3" />
            <div className="flex items-center justify-between">
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>{deckProgress.studiedCards} of {deckProgress.totalCards} cards studied</span>
                {deckProgress.studiedCards > 0 && (
                  <>
                    <span>•</span>
                    <span>{deckProgress.masteredCards} cards mastered</span>
                    <span>•</span>
                    <span>{deckProgress.averageMastery}% avg. accuracy</span>
                  </>
                )}
              </div>
              {cards.length > 0 && (
                <StudySessionModal
                  deckId={deckId}
                  cards={cards}
                  mode="standard"
                  triggerButton={
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                      Start Study Session
                    </Button>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Cards Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
            <CreateCardModal 
              deckId={deckId}
              triggerButton={
                <Button variant="secondary">
                  Add New Card
                </Button>
              }
            />
          </div>
          
          {cards.length === 0 ? (
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="text-center py-16">
                <div className="space-y-4">
                  <div className="text-6xl">📚</div>
                  <div>
                    <p className="text-xl font-medium mb-2">
                      No cards yet
                    </p>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      This deck is empty. Add your first flashcard to start building your study materials!
                    </p>
                  </div>
                  <CreateCardModal 
                    deckId={deckId}
                    triggerButton={
                      <Button size="lg">
                        Create Your First Card
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cards.map((card, index) => (
                <Card 
                  key={card.id} 
                  className="group relative overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-gradient-to-br from-card to-card/70"
                >
                  {/* Edit button overlay */}
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <EditCardModal
                      card={{
                        id: card.id,
                        front: card.front,
                        back: card.back,
                        deckId: deck.id,
                      }}
                      triggerButton={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background/80 hover:bg-background">
                          ✏️
                        </Button>
                      }
                    />
                  </div>
                  
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <p className="text-xs font-medium text-primary mb-2 uppercase tracking-wide">
                          Question
                        </p>
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {card.front}
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-2 uppercase tracking-wide">
                          Answer
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {card.back}
                        </p>
                      </div>
                    </div>
                    
                    {card.updatedAt && (
                      <div className="pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(card.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Study Options - Only show if there are cards */}
        {cards.length > 0 && (
          <Card className="bg-gradient-to-r from-card via-card/95 to-card/90 border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Study Modes</CardTitle>
              <CardDescription>
                Choose your preferred way to study this deck
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StudySessionModal
                  deckId={deckId}
                  cards={cards}
                  mode="standard"
                  triggerButton={
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 text-left border-dashed hover:border-solid hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full"
                    >
                      <div className="space-y-2">
                        <div className="text-2xl">📖</div>
                        <div className="font-semibold">Standard Review</div>
                        <div className="text-sm text-muted-foreground">
                          Study cards in order, perfect for first-time learning
                        </div>
                      </div>
                    </Button>
                  }
                />
                
                <StudySessionModal
                  deckId={deckId}
                  cards={cards}
                  mode="shuffle"
                  triggerButton={
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 text-left border-dashed hover:border-solid hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full"
                    >
                      <div className="space-y-2">
                        <div className="text-2xl">🔀</div>
                        <div className="font-semibold">Random Shuffle</div>
                        <div className="text-sm text-muted-foreground">
                          Mix up the order to test your knowledge thoroughly
                        </div>
                      </div>
                    </Button>
                  }
                />
                
                <StudySessionModal
                  deckId={deckId}
                  cards={cards}
                  mode="timed"
                  triggerButton={
                    <Button 
                      variant="outline" 
                      className="h-auto p-6 text-left border-dashed hover:border-solid hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full"
                    >
                      <div className="space-y-2">
                        <div className="text-2xl">⏱️</div>
                        <div className="font-semibold">Timed Challenge</div>
                        <div className="text-sm text-muted-foreground">
                          Race against time to boost your recall speed
                        </div>
                      </div>
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}