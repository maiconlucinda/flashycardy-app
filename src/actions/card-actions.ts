'use server';

import { auth } from '@clerk/nextjs/server';
import { createCard, updateCard, deleteCard } from '@/db/queries/cards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateCardSchema = z.object({
  front: z.string().min(1, 'Front side is required').max(2000, 'Front side is too long'),
  back: z.string().min(1, 'Back side is required').max(2000, 'Back side is too long'),
  deckId: z.number().positive('Invalid deck ID'),
});

const UpdateCardSchema = z.object({
  id: z.number().positive('Invalid card ID'),
  front: z.string().min(1, 'Front side is required').max(2000, 'Front side is too long'),
  back: z.string().min(1, 'Back side is required').max(2000, 'Back side is too long'),
});

const DeleteCardSchema = z.object({
  id: z.number().positive('Invalid card ID'),
  deckId: z.number().positive('Invalid deck ID'),
});

type CreateCardInput = z.infer<typeof CreateCardSchema>;
type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
type DeleteCardInput = z.infer<typeof DeleteCardSchema>;

export async function createCardAction(input: CreateCardInput) {
  try {
    // Validate input
    const validatedInput = CreateCardSchema.parse(input);
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Create card using query function
    const newCard = await createCard(
      {
        front: validatedInput.front,
        back: validatedInput.back,
        deckId: validatedInput.deckId,
      },
      userId
    );

    // Revalidate relevant paths
    revalidatePath(`/decks/${validatedInput.deckId}`);
    revalidatePath('/dashboard');
    
    return { success: true, card: newCard };
  } catch (error) {
    console.error('Error creating card:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    if (error instanceof Error && error.message === 'Deck not found or unauthorized') {
      return { success: false, error: 'Deck not found or unauthorized' };
    }
    return { success: false, error: 'Failed to create card' };
  }
}

export async function updateCardAction(input: UpdateCardInput) {
  try {
    // Validate input
    const validatedInput = UpdateCardSchema.parse(input);
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update card using query function
    const updatedCard = await updateCard(
      validatedInput.id,
      userId,
      {
        front: validatedInput.front,
        back: validatedInput.back,
      }
    );

    // Revalidate relevant paths
    revalidatePath(`/decks/${updatedCard.deckId}`);
    revalidatePath('/dashboard');
    
    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('Error updating card:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    if (error instanceof Error && error.message === 'Card not found or unauthorized') {
      return { success: false, error: 'Card not found or unauthorized' };
    }
    return { success: false, error: 'Failed to update card' };
  }
}

export async function deleteCardAction(input: DeleteCardInput) {
  try {
    // Validate input
    const validatedInput = DeleteCardSchema.parse(input);
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete card using query function
    const deletedCard = await deleteCard(validatedInput.id, userId);

    // Revalidate relevant paths
    revalidatePath(`/decks/${validatedInput.deckId}`);
    revalidatePath('/dashboard');
    
    return { success: true, card: deletedCard };
  } catch (error) {
    console.error('Error deleting card:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    if (error instanceof Error && error.message === 'Card not found or unauthorized') {
      return { success: false, error: 'Card not found or unauthorized' };
    }
    return { success: false, error: 'Failed to delete card' };
  }
}