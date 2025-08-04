import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getDeckById } from '@/db/queries/decks';
import { getDeckCardsOnly } from '@/db/queries/cards';
import { StudyPageContent } from './study-page-content';
import { Button } from '@/components/ui/button';

interface StudyPageProps {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{
    mode?: 'standard' | 'shuffle' | 'timed';
  }>;
}

export default async function StudyPage({ params, searchParams }: StudyPageProps) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }

  // Await params in Next.js 15
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Parse deckId to number
  const deckId = parseInt(resolvedParams.deckId);
  if (isNaN(deckId) || deckId <= 0) {
    notFound();
  }

  const mode = resolvedSearchParams.mode || 'standard';

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
    deckId: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    // Fetch deck and verify ownership
    deck = await getDeckById(deckId, userId);
    if (!deck) {
      notFound();
    }

    // Fetch cards for this deck
    cards = await getDeckCardsOnly(deckId, userId);
  } catch (error) {
    console.error('Error fetching deck data:', error);
    notFound();
  }

  if (cards.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/decks/${deckId}`}>
            <Button variant="outline" size="sm">
              ← Back to Deck
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold mb-2">No cards to study</h1>
          <p className="text-muted-foreground mb-6">
            This deck doesn&apos;t have any cards yet. Add some cards to start studying!
          </p>
          <Link href={`/decks/${deckId}`}>
            <Button size="lg">
              Go Back to Deck
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/decks/${deckId}`}>
          <Button variant="outline" size="sm">
            ← Back to Deck
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{deck.title}</h1>
          <p className="text-muted-foreground">Study Session</p>
        </div>
      </div>
      
      <StudyPageContent 
        deckId={deckId}
        cards={cards}
        mode={mode}
      />
    </div>
  );
}