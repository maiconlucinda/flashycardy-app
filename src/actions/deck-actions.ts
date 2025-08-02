'use server';

import { auth } from '@clerk/nextjs/server';
import { updateDeck } from '@/db/queries/decks';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const UpdateDeckSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long'),
});

type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;

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
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` 
      };
    }
    
    return { success: false, error: 'Failed to update deck' };
  }
}