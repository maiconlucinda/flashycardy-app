import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserDecks } from '@/db/queries/decks';
import { decksTable } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreateDeckModal } from '@/components/create-deck-modal';
import { Plus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Deck = typeof decksTable.$inferSelect;

export default async function Dashboard() {
  // Verificar autenticação
  const { userId, has } = await auth();
  if (!userId) {
    redirect('/');
  }

  // Check billing features
  const hasUnlimitedDecks = has({ feature: 'unlimited_decks' });
  const has3DeckLimit = has({ feature: '3_deck_limit' });

  let userDecks: Deck[] = [];
  let hasError = false;
  
  try {
    // Buscar decks do usuário
    userDecks = await getUserDecks(userId);
  } catch (error) {
    console.error('Error fetching user decks:', error);
    hasError = true;
    // Continue with empty array to show appropriate error state
  }

  // Calculate if user has reached deck limit
  const currentDeckCount = userDecks.length;
  const hasReachedLimit = !hasUnlimitedDecks && has3DeckLimit && currentDeckCount >= 3;

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your decks and your Study Progress
          </p>
        </div>

        {/* User Decks Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Your Decks</h2>
              {has3DeckLimit && !hasUnlimitedDecks && (
                <Badge variant="secondary" className="text-xs">
                  {currentDeckCount}/3 decks
                </Badge>
              )}
            </div>
            {hasReachedLimit ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Limit reached
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Upgrade for unlimited decks
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="flex-shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900">
                  <Link href="/pricing">Upgrade</Link>
                </Button>
              </div>
            ) : (
              <CreateDeckModal />
            )}
          </div>
          {hasError ? (
            <Alert variant="destructive">
              <AlertTitle>Oops! There was an error loading your decks.</AlertTitle>
              <AlertDescription>
                Please refresh the page or try again later.
              </AlertDescription>
            </Alert>
          ) : userDecks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-lg mb-4">
                  You don&apos;t have any decks yet.
                </p>
                <p className="text-muted-foreground mb-6">
                  Create your first deck to start learning!
                </p>
                {hasReachedLimit ? (
                  <div className="flex items-center justify-center gap-3 p-4 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 max-w-sm mx-auto">
                    <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Upgrade to Pro
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                        Unlock unlimited decks!
                      </p>
                      <Button asChild size="sm">
                        <Link href="/pricing">Upgrade Now</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CreateDeckModal 
                    triggerButton={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Deck
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDecks.map((deck) => (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-xl">{deck.title}</CardTitle>
                      {deck.description && (
                        <CardDescription className="line-clamp-2">
                          {deck.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Updated: {new Date(deck.updatedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}