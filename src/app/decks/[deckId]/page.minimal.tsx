import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';

interface DeckPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  console.log('DeckPage: Starting rendering');
  
  // Test 1: Check if auth works
  try {
    const { userId } = await auth();
    console.log('DeckPage: Auth result:', { userId });
    
    if (!userId) {
      console.log('DeckPage: No userId, redirecting');
      redirect('/');
    }
  } catch (error) {
    console.error('DeckPage: Auth error:', error);
    return <div>Auth Error: {String(error)}</div>;
  }

  // Test 2: Check if params work
  try {
    const resolvedParams = await params;
    console.log('DeckPage: Resolved params:', resolvedParams);
    
    const deckId = parseInt(resolvedParams.deckId);
    console.log('DeckPage: Parsed deckId:', deckId);
    
    if (isNaN(deckId) || deckId <= 0) {
      console.log('DeckPage: Invalid deckId, calling notFound');
      notFound();
    }
  } catch (error) {
    console.error('DeckPage: Params error:', error);
    return <div>Params Error: {String(error)}</div>;
  }

  console.log('DeckPage: Rendering successful');
  
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Minimal Deck Page Test</h1>
        <p>If you see this, basic SSR is working!</p>
      </main>
    </div>
  );
}