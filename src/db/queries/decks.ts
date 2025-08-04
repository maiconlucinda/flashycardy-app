import { db } from '@/db';
import { decksTable } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Get all decks for a specific user
 */
export async function getUserDecks(userId: string) {
  return await db.select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId))
    .orderBy(desc(decksTable.updatedAt));
}

/**
 * Get the total count of decks for a specific user
 */
export async function getUserDeckCount(userId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(decksTable)
    .where(eq(decksTable.userId, userId));
    
  return result[0]?.count || 0;
}

/**
 * Get all decks (for admin/testing purposes)
 */
export async function getAllDecks() {
  return await db.select().from(decksTable);
}

/**
 * Get a specific deck by ID with ownership check
 */
export async function getDeckById(deckId: number, userId: string) {
  const [deck] = await db.select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ))
    .limit(1);
  
  return deck;
}

/**
 * Create a new deck
 */
export async function createDeck(data: {
  title: string;
  description?: string;
  userId: string;
}) {
  const [newDeck] = await db.insert(decksTable)
    .values(data)
    .returning();
  
  return newDeck;
}

/**
 * Update an existing deck with ownership check
 */
export async function updateDeck(
  deckId: number,
  userId: string,
  updates: { title?: string; description?: string }
) {
  const [updatedDeck] = await db.update(decksTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ))
    .returning();
    
  return updatedDeck;
}

/**
 * Delete a deck with ownership check
 */
export async function deleteDeck(deckId: number, userId: string) {
  const [deletedDeck] = await db.delete(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ))
    .returning();
    
  return deletedDeck;
}

/**
 * Delete a deck by ID (for testing purposes, no ownership check)
 */
export async function deleteDeckById(deckId: number) {
  const [deletedDeck] = await db.delete(decksTable)
    .where(eq(decksTable.id, deckId))
    .returning();
    
  return deletedDeck;
}