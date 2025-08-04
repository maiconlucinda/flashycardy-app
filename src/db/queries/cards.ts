import { db } from '@/db';
import { cardsTable, decksTable } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get all cards for a specific deck with ownership check
 * Cards are ordered by updatedAt in descending order (most recent first)
 */
export async function getDeckCards(deckId: number, userId: string) {
  return await db.select()
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(
      eq(cardsTable.deckId, deckId),
      eq(decksTable.userId, userId)
    ))
    .orderBy(desc(cardsTable.updatedAt));
}

/**
 * Get only card data for a specific deck with ownership check
 * Cards are ordered by updatedAt in descending order (most recent first)
 */
export async function getDeckCardsOnly(deckId: number, userId: string) {
  return await db.select({
    id: cardsTable.id,
    front: cardsTable.front,
    back: cardsTable.back,
    deckId: cardsTable.deckId,
    createdAt: cardsTable.createdAt,
    updatedAt: cardsTable.updatedAt,
  })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(
      eq(cardsTable.deckId, deckId),
      eq(decksTable.userId, userId)
    ))
    .orderBy(desc(cardsTable.updatedAt));
}

/**
 * Get cards by deck ID (for testing purposes, no ownership check)
 * Cards are ordered by updatedAt in descending order (most recent first)
 */
export async function getCardsByDeckId(deckId: number) {
  return await db.select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .orderBy(desc(cardsTable.updatedAt));
}

/**
 * Create a new card with ownership check on the deck
 */
export async function createCard(data: {
  front: string;
  back: string;
  deckId: number;
}, userId: string) {
  // First verify the user owns the deck
  const [deck] = await db.select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, data.deckId),
      eq(decksTable.userId, userId)
    ))
    .limit(1);

  if (!deck) {
    throw new Error('Deck not found or unauthorized');
  }

  const [newCard] = await db.insert(cardsTable)
    .values(data)
    .returning();
  
  return newCard;
}

/**
 * Create multiple cards with ownership check on the deck
 */
export async function createCards(cards: {
  front: string;
  back: string;
  deckId: number;
}[], userId: string) {
  if (cards.length === 0) return [];
  
  // Verify the user owns the deck (using the first card's deckId)
  const deckId = cards[0].deckId;
  const [deck] = await db.select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ))
    .limit(1);

  if (!deck) {
    throw new Error('Deck not found or unauthorized');
  }

  // Verify all cards belong to the same deck
  const allSameDeck = cards.every(card => card.deckId === deckId);
  if (!allSameDeck) {
    throw new Error('All cards must belong to the same deck');
  }

  const newCards = await db.insert(cardsTable)
    .values(cards)
    .returning();
  
  return newCards;
}

/**
 * Create cards without ownership check (for testing purposes)
 */
export async function createCardsForTesting(cards: {
  front: string;
  back: string;
  deckId: number;
}[]) {
  if (cards.length === 0) return [];
  
  const newCards = await db.insert(cardsTable)
    .values(cards)
    .returning();
  
  return newCards;
}

/**
 * Update a card with ownership check
 */
export async function updateCard(
  cardId: number,
  userId: string,
  updates: { front?: string; back?: string }
) {
  // First verify the user owns the deck that contains this card
  const [cardWithDeck] = await db.select()
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(
      eq(cardsTable.id, cardId),
      eq(decksTable.userId, userId)
    ))
    .limit(1);

  if (!cardWithDeck) {
    throw new Error('Card not found or unauthorized');
  }

  const [updatedCard] = await db.update(cardsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(cardsTable.id, cardId))
    .returning();
    
  return updatedCard;
}

/**
 * Delete a card with ownership check
 */
export async function deleteCard(cardId: number, userId: string) {
  // First verify the user owns the deck that contains this card
  const [cardWithDeck] = await db.select()
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(
      eq(cardsTable.id, cardId),
      eq(decksTable.userId, userId)
    ))
    .limit(1);

  if (!cardWithDeck) {
    throw new Error('Card not found or unauthorized');
  }

  const [deletedCard] = await db.delete(cardsTable)
    .where(eq(cardsTable.id, cardId))
    .returning();
    
  return deletedCard;
}

/**
 * Delete all cards from a deck with ownership check
 */
export async function deleteCardsByDeck(deckId: number, userId: string) {
  // First verify the user owns the deck
  const [deck] = await db.select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ))
    .limit(1);

  if (!deck) {
    throw new Error('Deck not found or unauthorized');
  }

  const deletedCards = await db.delete(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .returning();
    
  return deletedCards;
}

/**
 * Delete cards by deck ID (for testing purposes, no ownership check)
 */
export async function deleteCardsByDeckId(deckId: number) {
  const deletedCards = await db.delete(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .returning();
    
  return deletedCards;
}

