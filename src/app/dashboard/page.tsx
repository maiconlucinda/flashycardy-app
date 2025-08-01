import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserDecks } from '@/db/queries/decks';
import { decksTable } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Deck = typeof decksTable.$inferSelect;

export default async function Dashboard() {
  // Verificar autenticação
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }

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

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Welcome back to FlashyCardy!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Ready to continue learning with your flashcards?
          </p>
        </div>

        {/* Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Create Deck</CardTitle>
              <CardDescription>Start a new flashcard deck</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Study</CardTitle>
              <CardDescription>Practice with existing decks</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Track your learning progress</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* User Decks Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Decks</h2>
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
                  You don't have any decks yet.
                </p>
                <p className="text-muted-foreground">
                  Create your first deck to start learning!
                </p>
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

        {/* Debug Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              User ID: {userId}
            </p>
            <p className="text-xs text-muted-foreground">
              Decks found: {userDecks.length}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}