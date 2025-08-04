'use server';

import { auth } from '@clerk/nextjs/server';
import { createDeck, updateDeck, deleteDeck, getUserDeckCount } from '@/db/queries/decks';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const CreateDeckSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

const UpdateDeckSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long'),
});

type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;

const DeleteDeckSchema = z.object({
  id: z.number().positive(),
});

type DeleteDeckInput = z.infer<typeof DeleteDeckSchema>;

export async function createDeckAction(input: CreateDeckInput) {
  try {
    // Validate input
    const validatedInput = CreateDeckSchema.parse(input);
    
    // Authenticate user
    const { userId, has } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check billing features
    const hasUnlimitedDecks = has({ feature: 'unlimited_decks' });
    const has3DeckLimit = has({ feature: '3_deck_limit' });
    
    if (!hasUnlimitedDecks) {
      // Check deck limit for free users
      const currentDeckCount = await getUserDeckCount(userId);
      
      if (has3DeckLimit && currentDeckCount >= 3) {
        return {
          success: false,
          error: 'Deck limit reached. Upgrade to Pro for unlimited decks.',
          requiresUpgrade: true
        };
      }
    }

    // Create deck using query function
    const newDeck = await createDeck({
      title: validatedInput.title,
      description: validatedInput.description && validatedInput.description.trim() !== '' 
        ? validatedInput.description 
        : undefined,
      userId,
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    
    return { success: true, deck: newDeck };
  } catch (error) {
    console.error('Error creating deck:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    return { success: false, error: 'Failed to create deck' };
  }
}

export async function updateDeckAction(input: UpdateDeckInput) {
  try {
    // Validate input
    const validatedInput = UpdateDeckSchema.parse(input);
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update deck using query function
    const updatedDeck = await updateDeck(
      validatedInput.id,
      userId,
      {
        title: validatedInput.title,
        description: validatedInput.description && validatedInput.description.trim() !== '' 
          ? validatedInput.description 
          : undefined,
      }
    );

    if (!updatedDeck) {
      return { success: false, error: 'Deck not found or unauthorized' };
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath(`/decks/${validatedInput.id}`);
    
    return { success: true, deck: updatedDeck };
  } catch (error) {
    console.error('Error updating deck:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    return { success: false, error: 'Failed to update deck' };
  }
}

export async function deleteDeckAction(input: DeleteDeckInput) {
  try {
    // Validate input
    const validatedInput = DeleteDeckSchema.parse(input);
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete deck using query function
    const deletedDeck = await deleteDeck(validatedInput.id, userId);

    if (!deletedDeck) {
      return { success: false, error: 'Deck not found or unauthorized' };
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    
    return { success: true, deletedDeck };
  } catch (error) {
    console.error('Error deleting deck:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    return { success: false, error: 'Failed to delete deck' };
  }
}