import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getDeckById } from '@/db/queries/decks';
import { getDeckCards } from '@/db/queries/cards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DeckPageProps {
  params: {
    deckId: string;
  };
}

export default async function DeckPage({ params }: DeckPageProps) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }

  // Parse deckId to number
  const deckId = parseInt(params.deckId);
  if (isNaN(deckId) || deckId <= 0) {
    notFound();
  }

  let deck;
  let cards: any[] = [];
  let hasError = false;
  
  try {
    // Fetch deck with ownership check
    deck = await getDeckById(deckId, userId);
    
    if (!deck) {
      notFound();
    }

    // Fetch cards for this deck
    const cardsResult = await getDeckCards(deckId, userId);
    cards = cardsResult.map(result => result.cards);
  } catch (error) {
    console.error('Error fetching deck or cards:', error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="min-h-screen p-8">
        <main className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Deck</AlertTitle>
            <AlertDescription>
              There was an error loading this deck. Please try again later.
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
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Deck Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{deck.title}</h1>
              {deck.description && (
                <p className="text-xl text-muted-foreground">{deck.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground mb-6">
            Created: {new Date(deck.createdAt).toLocaleDateString()} • 
            Last updated: {new Date(deck.updatedAt).toLocaleDateString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button size="lg">
              Start Studying
            </Button>
            <Button variant="secondary" size="lg">
              Add Cards
            </Button>
            <Button variant="outline" size="lg">
              Edit Deck
            </Button>
          </div>
        </div>

        {/* Cards Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Flashcards</h2>
          
          {cards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-lg mb-4">
                  This deck doesn't have any cards yet.
                </p>
                <p className="text-muted-foreground mb-6">
                  Add some flashcards to start studying!
                </p>
                <Button>
                  Add Your First Card
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map((card, index) => (
                <Card key={card.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Card {index + 1}</CardTitle>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Front:
                        </p>
                        <p className="text-base">{card.front}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Back:
                        </p>
                        <p className="text-base">{card.back}</p>
                      </div>
                    </div>
                    
                    {card.updatedAt && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(card.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Study Options */}
        {cards.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Study Options</CardTitle>
              <CardDescription>
                Choose how you want to study this deck
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-4">
                  <div className="text-center">
                    <div className="font-medium">Standard Review</div>
                    <div className="text-sm text-muted-foreground">
                      Go through all cards
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4">
                  <div className="text-center">
                    <div className="font-medium">Random Order</div>
                    <div className="text-sm text-muted-foreground">
                      Shuffle the cards
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4">
                  <div className="text-center">
                    <div className="font-medium">Timed Practice</div>
                    <div className="text-sm text-muted-foreground">
                      Race against the clock
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>User ID: {userId}</p>
              <p>Deck ID: {deck.id}</p>
              <p>Cards loaded: {cards.length}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}