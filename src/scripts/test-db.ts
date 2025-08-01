import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { decksTable, cardsTable } from '../db/schema';
import { Pool } from 'pg';
import { createDeck, getAllDecks, deleteDeckById, updateDeck } from '../db/queries/decks';
import { createCardsForTesting, getCardsByDeckId, deleteCardsByDeckId } from '../db/queries/cards';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: true
  }
});

const db = drizzle(pool);

async function main() {
  try {
    // Criar um deck de teste
    const deck: typeof decksTable.$inferInsert = {
      title: 'Portuguese Language',
      description: 'Learning Portuguese vocabulary',
      userId: 'test-user-123',
    };

    const newDeck = await createDeck(deck);
    console.log('✅ New deck created:', newDeck);

    // Criar cards de teste
    const cards: typeof cardsTable.$inferInsert[] = [
      {
        front: 'Dog',
        back: 'Cachorro',
        deckId: newDeck.id,
      },
      {
        front: 'Cat',
        back: 'Gato',
        deckId: newDeck.id,
      }
    ];

    await createCardsForTesting(cards);
    console.log('✅ Cards created!');

    // Buscar todos os decks
    const allDecks = await getAllDecks();
    console.log('📚 All decks:', allDecks);

    // Buscar cards do deck
    const deckCards = await getCardsByDeckId(newDeck.id);
    console.log('🃏 Cards in deck:', deckCards);

    // Atualizar deck
    await updateDeck(newDeck.id, 'test-user-123', {
      description: 'Advanced Portuguese vocabulary',
    });
    console.log('✅ Deck updated!');

    // Limpar dados de teste
    await deleteCardsByDeckId(newDeck.id);
    await deleteDeckById(newDeck.id);
    console.log('✅ Test data cleaned up!');

    console.log('🎉 Flashcard database test successful!');
  } catch (error) {
    console.error('❌ Database operation failed:', error);
  } finally {
    await pool.end();
  }
}

main();