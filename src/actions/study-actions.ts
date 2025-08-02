'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { 
  createStudySession, 
  updateStudySession, 
  getActiveStudySession,
  updateCardProgress,
  getDeckProgress 
} from '@/db/queries/progress';
import { getDeckCards } from '@/db/queries/cards';

// Start Study Session Schema
const StartStudySessionSchema = z.object({
  deckId: z.number().positive(),
  mode: z.enum(['standard', 'shuffle', 'timed']),
});

type StartStudySessionInput = z.infer<typeof StartStudySessionSchema>;

export async function startStudySession(input: StartStudySessionInput) {
  const validatedInput = StartStudySessionSchema.parse(input);
  
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Check if there's already an active session
    const existingSession = await getActiveStudySession(validatedInput.deckId, userId);
    if (existingSession) {
      return { 
        success: true, 
        sessionId: existingSession.id,
        message: 'Resuming existing study session'
      };
    }

    // Get deck cards to determine total cards
    const cardsResult = await getDeckCards(validatedInput.deckId, userId);
    const cards = cardsResult.map(result => result.cards);

    if (cards.length === 0) {
      return { success: false, error: 'No cards found in this deck' };
    }

    // Create new study session
    const session = await createStudySession({
      deckId: validatedInput.deckId,
      userId,
      mode: validatedInput.mode,
      totalCards: cards.length,
    });

    revalidatePath(`/decks/${validatedInput.deckId}`);
    return { 
      success: true, 
      sessionId: session.id,
      message: 'Study session started successfully'
    };
  } catch (error) {
    console.error('Error starting study session:', error);
    return { success: false, error: 'Failed to start study session' };
  }
}

// Complete Study Session Schema
const CompleteStudySessionSchema = z.object({
  sessionId: z.number().positive(),
  deckId: z.number().positive(),
});

type CompleteStudySessionInput = z.infer<typeof CompleteStudySessionSchema>;

export async function completeStudySession(input: CompleteStudySessionInput) {
  const validatedInput = CompleteStudySessionSchema.parse(input);
  
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const session = await updateStudySession(
      validatedInput.sessionId,
      userId,
      {
        completed: true,
        completedAt: new Date(),
      }
    );

    if (!session) {
      return { success: false, error: 'Study session not found' };
    }

    revalidatePath(`/decks/${validatedInput.deckId}`);
    return { 
      success: true, 
      message: 'Study session completed successfully',
      session 
    };
  } catch (error) {
    console.error('Error completing study session:', error);
    return { success: false, error: 'Failed to complete study session' };
  }
}

// Review Card Schema
const ReviewCardSchema = z.object({
  sessionId: z.number().positive(),
  cardId: z.number().positive(),
  deckId: z.number().positive(),
  isCorrect: z.boolean(),
});

type ReviewCardInput = z.infer<typeof ReviewCardSchema>;

export async function reviewCard(input: ReviewCardInput) {
  const validatedInput = ReviewCardSchema.parse(input);
  
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Update card progress
    await updateCardProgress({
      cardId: validatedInput.cardId,
      userId,
      deckId: validatedInput.deckId,
      isCorrect: validatedInput.isCorrect,
    });

    // Get current session to update it
    const currentSession = await getActiveStudySession(validatedInput.deckId, userId);
    if (currentSession && currentSession.id === validatedInput.sessionId) {
      await updateStudySession(
        validatedInput.sessionId,
        userId,
        {
          cardsStudied: currentSession.cardsStudied + 1,
          correctAnswers: currentSession.correctAnswers + (validatedInput.isCorrect ? 1 : 0),
        }
      );
    }

    revalidatePath(`/decks/${validatedInput.deckId}`);
    return { 
      success: true, 
      message: 'Card reviewed successfully'
    };
  } catch (error) {
    console.error('Error reviewing card:', error);
    return { success: false, error: 'Failed to review card' };
  }
}

// Get Study Progress Schema
const GetStudyProgressSchema = z.object({
  deckId: z.number().positive(),
});

type GetStudyProgressInput = z.infer<typeof GetStudyProgressSchema>;

export async function getStudyProgress(input: GetStudyProgressInput) {
  const validatedInput = GetStudyProgressSchema.parse(input);
  
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const progress = await getDeckProgress(validatedInput.deckId, userId);
    return { success: true, progress };
  } catch (error) {
    console.error('Error getting study progress:', error);
    return { success: false, error: 'Failed to get study progress' };
  }
}