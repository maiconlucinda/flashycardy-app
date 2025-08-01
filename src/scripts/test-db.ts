import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { decksTable, cardsTable } from '../db/schema';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), 'rds-ca-2019-root.pem')).toString(),
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

    const [newDeck] = await db.insert(decksTable).values(deck).returning();
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

    await db.insert(cardsTable).values(cards);
    console.log('✅ Cards created!');

    // Buscar todos os decks
    const allDecks = await db.select().from(decksTable);
    console.log('📚 All decks:', allDecks);

    // Buscar cards do deck
    const deckCards = await db.select().from(cardsTable).where(eq(cardsTable.deckId, newDeck.id));
    console.log('🃏 Cards in deck:', deckCards);

    // Atualizar deck
    await db
      .update(decksTable)
      .set({
        description: 'Advanced Portuguese vocabulary',
      })
      .where(eq(decksTable.id, newDeck.id));
    console.log('✅ Deck updated!');

    // Limpar dados de teste
    await db.delete(cardsTable).where(eq(cardsTable.deckId, newDeck.id));
    await db.delete(decksTable).where(eq(decksTable.id, newDeck.id));
    console.log('✅ Test data cleaned up!');

    console.log('🎉 Flashcard database test successful!');
  } catch (error) {
    console.error('❌ Database operation failed:', error);
  } finally {
    await pool.end();
  }
}

main();