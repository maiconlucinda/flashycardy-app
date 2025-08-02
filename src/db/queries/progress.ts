import { db } from '@/db';
import { studySessionsTable, cardProgressTable, cardsTable, decksTable } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Study Session Queries
export async function createStudySession(data: {
  deckId: number;
  userId: string;
  mode: string;
  totalCards: number;
}) {
  const [session] = await db.insert(studySessionsTable)
    .values(data)
    .returning();
  
  return session;
}

export async function updateStudySession(
  sessionId: number,
  userId: string,
  updates: {
    cardsStudied?: number;
    correctAnswers?: number;
    completed?: boolean;
    completedAt?: Date;
  }
) {
  const [session] = await db.update(studySessionsTable)
    .set(updates)
    .where(and(
      eq(studySessionsTable.id, sessionId),
      eq(studySessionsTable.userId, userId)
    ))
    .returning();
    
  return session;
}

export async function getActiveStudySession(deckId: number, userId: string) {
  const [session] = await db.select()
    .from(studySessionsTable)
    .where(and(
      eq(studySessionsTable.deckId, deckId),
      eq(studySessionsTable.userId, userId),
      eq(studySessionsTable.completed, false)
    ))
    .orderBy(desc(studySessionsTable.startedAt))
    .limit(1);
    
  return session;
}

export async function getUserStudySessions(userId: string, limit: number = 10) {
  return await db.select({
    session: studySessionsTable,
    deck: {
      id: decksTable.id,
      title: decksTable.title,
    }
  })
    .from(studySessionsTable)
    .innerJoin(decksTable, eq(studySessionsTable.deckId, decksTable.id))
    .where(eq(studySessionsTable.userId, userId))
    .orderBy(desc(studySessionsTable.startedAt))
    .limit(limit);
}

// Card Progress Queries
export async function updateCardProgress(data: {
  cardId: number;
  userId: string;
  deckId: number;
  isCorrect: boolean;
}) {
  // First, try to get existing progress
  const [existingProgress] = await db.select()
    .from(cardProgressTable)
    .where(and(
      eq(cardProgressTable.cardId, data.cardId),
      eq(cardProgressTable.userId, data.userId)
    ))
    .limit(1);

  const now = new Date();
  
  if (existingProgress) {
    // Update existing progress
    const newTotalReviews = existingProgress.totalReviews + 1;
    const newCorrectReviews = existingProgress.correctReviews + (data.isCorrect ? 1 : 0);
    const newMasteryLevel = Math.min(100, Math.floor((newCorrectReviews / newTotalReviews) * 100));
    
    const [updatedProgress] = await db.update(cardProgressTable)
      .set({
        totalReviews: newTotalReviews,
        correctReviews: newCorrectReviews,
        lastReviewed: now,
        masteryLevel: newMasteryLevel,
        updatedAt: now,
      })
      .where(eq(cardProgressTable.id, existingProgress.id))
      .returning();
      
    return updatedProgress;
  } else {
    // Create new progress entry
    const [newProgress] = await db.insert(cardProgressTable)
      .values({
        cardId: data.cardId,
        userId: data.userId,
        deckId: data.deckId,
        totalReviews: 1,
        correctReviews: data.isCorrect ? 1 : 0,
        lastReviewed: now,
        masteryLevel: data.isCorrect ? 100 : 0,
      })
      .returning();
      
    return newProgress;
  }
}

export async function getDeckProgress(deckId: number, userId: string) {
  // Get all cards for the deck
  const cards = await db.select({
    cardId: cardsTable.id,
  })
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId));

  if (cards.length === 0) {
    return {
      totalCards: 0,
      studiedCards: 0,
      masteredCards: 0,
      averageMastery: 0,
      progressPercentage: 0,
    };
  }

  // Get progress for all cards
  const progressData = await db.select({
    cardId: cardProgressTable.cardId,
    masteryLevel: cardProgressTable.masteryLevel,
    totalReviews: cardProgressTable.totalReviews,
  })
    .from(cardProgressTable)
    .where(and(
      eq(cardProgressTable.deckId, deckId),
      eq(cardProgressTable.userId, userId)
    ));

  const totalCards = cards.length;
  const studiedCards = progressData.length;
  const masteredCards = progressData.filter(p => p.masteryLevel >= 80).length;
  const averageMastery = studiedCards > 0 
    ? Math.floor(progressData.reduce((sum, p) => sum + p.masteryLevel, 0) / studiedCards)
    : 0;
  const progressPercentage = Math.floor((studiedCards / totalCards) * 100);

  return {
    totalCards,
    studiedCards,
    masteredCards,
    averageMastery,
    progressPercentage,
    cardProgress: progressData,
  };
}

export async function getCardProgress(cardId: number, userId: string) {
  const [progress] = await db.select()
    .from(cardProgressTable)
    .where(and(
      eq(cardProgressTable.cardId, cardId),
      eq(cardProgressTable.userId, userId)
    ))
    .limit(1);
    
  return progress;
}

export async function resetDeckProgress(deckId: number, userId: string) {
  return await db.delete(cardProgressTable)
    .where(and(
      eq(cardProgressTable.deckId, deckId),
      eq(cardProgressTable.userId, userId)
    ))
    .returning();
}