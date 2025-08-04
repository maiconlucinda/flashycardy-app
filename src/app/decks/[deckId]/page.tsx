import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getDeckById } from '@/db/queries/decks';
import { getDeckCardsOnly } from '@/db/queries/cards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreateCardModal } from '@/components/create-card-modal';
import { EditDeckModal } from '@/components/edit-deck-modal';
import { EditCardModal } from '@/components/edit-card-modal';
import { DeleteDeckModal } from '@/components/delete-deck-modal';
import { AIFlashcardGenerator } from '@/components/ai-flashcard-generator';


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

  // Fetch deck with ownership check
  const deck = await getDeckById(deckId, userId);
  
  // If deck doesn't exist, trigger not found
  if (!deck) {
    notFound();
  }
  
  let cards: Array<{
    id: number;
    front: string;
    back: string;
    updatedAt: Date | null;
  }> = [];
  let hasError = false;
  
  try {
    // Fetch cards for this deck
    cards = await getDeckCardsOnly(deckId, userId);
  } catch (error) {
    console.error('Error fetching cards:', error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="min-h-screen p-8">
        <main className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Cards</AlertTitle>
            <AlertDescription>
              There was an error loading the cards for this deck. Please try again later.
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
                    {deck.title}
                  </h1>
                  {deck.description && (
                    <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                      {deck.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: {new Date(deck.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Updated: {new Date(deck.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <Badge variant="secondary" className="text-base px-4 py-2 font-semibold">
                  {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </Badge>
                <div className="flex gap-2">
                  <EditDeckModal
                    deck={{
                      id: deck.id,
                      title: deck.title,
                      description: deck.description,
                    }}
                  />
                  <DeleteDeckModal
                    deckId={deck.id}
                    deckTitle={deck.title}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Study Button */}
        {cards.length > 0 && (
          <div className="flex justify-center">
            <Link href={`/decks/${deckId}/study?mode=standard`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                Start Studying
              </Button>
            </Link>
          </div>
        )}

        {/* Cards Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
            <div className="flex gap-2">
              <CreateCardModal 
                deckId={deckId}
                triggerButton={
                  <Button variant="secondary">
                    Add New Card
                  </Button>
                }
              />
              <AIFlashcardGenerator 
                deckId={deckId}
                deckTitle={deck.title}
                deckDescription={deck.description}
              />
            </div>
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
              {cards.map((card) => (
                <Card key={card.id} className="group relative">
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          ✏️
                        </Button>
                      }
                    />
                  </div>
                  
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <p className="text-xs font-medium text-primary mb-2 uppercase">
                          Question
                        </p>
                        <p className="text-sm font-medium">
                          {card.front}
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-2 uppercase">
                          Answer
                        </p>
                        <p className="text-sm">
                          {card.back}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Study Options */}
        {cards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Study Options</CardTitle>
              <CardDescription>
                Different ways to study this deck
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href={`/decks/${deckId}/study?mode=standard`}>
                  <Button variant="outline">
                    📖 Standard Review
                  </Button>
                </Link>
                <Link href={`/decks/${deckId}/study?mode=shuffle`}>
                  <Button variant="outline">
                    🔀 Random Shuffle
                  </Button>
                </Link>
                <Link href={`/decks/${deckId}/study?mode=timed`}>
                  <Button variant="outline">
                    ⏱️ Timed Challenge
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}