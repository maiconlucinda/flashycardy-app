'use server';

import { auth } from '@clerk/nextjs/server';
import { createCard, updateCard, deleteCard } from '@/db/queries/cards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateCardSchema = z.object({
  front: z.string().min(1, 'A pergunta é obrigatória').max(2000, 'Pergunta muito longa'),
  back: z.string().min(1, 'A resposta é obrigatória').max(2000, 'Resposta muito longa'),
  deckId: z.number().positive('ID do deck inválido'),
});

const UpdateCardSchema = z.object({
  id: z.number().positive('ID do card inválido'),
  front: z.string().min(1, 'A pergunta é obrigatória').max(2000, 'Pergunta muito longa'),
  back: z.string().min(1, 'A resposta é obrigatória').max(2000, 'Resposta muito longa'),
});

const DeleteCardSchema = z.object({
  id: z.number().positive('ID do card inválido'),
  deckId: z.number().positive('ID do deck inválido'),
});

type CreateCardInput = z.infer<typeof CreateCardSchema>;
type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
type DeleteCardInput = z.infer<typeof DeleteCardSchema>;

export async function createCardAction(input: CreateCardInput) {
  try {
    // Validar entrada
    const validatedInput = CreateCardSchema.parse(input);
    
    // Autenticar usuário
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Criar card usando a query function
    const newCard = await createCard(
      {
        front: validatedInput.front,
        back: validatedInput.back,
        deckId: validatedInput.deckId,
      },
      userId
    );

    // Revalidar as páginas relevantes
    revalidatePath(`/decks/${validatedInput.deckId}`);
    revalidatePath('/dashboard');
    
    return { success: true, card: newCard };
  } catch (error) {
    console.error('Erro ao criar card:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Erro de validação: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    if (error instanceof Error && error.message === 'Deck not found or unauthorized') {
      return { success: false, error: 'Deck não encontrado ou sem permissão' };
    }
    return { success: false, error: 'Falha ao criar card' };
  }
}

export async function updateCardAction(input: UpdateCardInput) {
  try {
    // Validar entrada
    const validatedInput = UpdateCardSchema.parse(input);
    
    // Autenticar usuário
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Atualizar card usando a query function
    const updatedCard = await updateCard(
      validatedInput.id,
      userId,
      {
        front: validatedInput.front,
        back: validatedInput.back,
      }
    );

    // Revalidar as páginas relevantes
    revalidatePath(`/decks/${updatedCard.deckId}`);
    revalidatePath('/dashboard');
    
    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('Erro ao atualizar card:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Erro de validação: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    if (error instanceof Error && error.message === 'Card not found or unauthorized') {
      return { success: false, error: 'Card não encontrado ou sem permissão' };
    }
    return { success: false, error: 'Falha ao atualizar card' };
  }
}

export async function deleteCardAction(input: DeleteCardInput) {
  try {
    // Validar entrada
    const validatedInput = DeleteCardSchema.parse(input);
    
    // Autenticar usuário
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Deletar card usando a query function
    const deletedCard = await deleteCard(validatedInput.id, userId);

    // Revalidar as páginas relevantes
    revalidatePath(`/decks/${validatedInput.deckId}`);
    revalidatePath('/dashboard');
    
    return { success: true, card: deletedCard };
  } catch (error) {
    console.error('Erro ao deletar card:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Erro de validação: ${error.issues.map(e => e.message).join(', ')}` 
      };
    }
    
    if (error instanceof Error && error.message === 'Card not found or unauthorized') {
      return { success: false, error: 'Card não encontrado ou sem permissão' };
    }
    return { success: false, error: 'Falha ao deletar card' };
  }
}