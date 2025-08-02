'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteCardAction } from '@/actions/card-actions';
import { toast } from 'sonner';

interface DeleteCardModalProps {
  cardId: number;
  deckId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteCardModal({ 
  cardId, 
  deckId, 
  isOpen, 
  onOpenChange, 
  onSuccess 
}: DeleteCardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteCardAction({
        id: cardId,
        deckId: deckId,
      });

      if (result.success) {
        // Show success notification
        toast.success('Card deletado com sucesso! 🗑️', {
          description: 'O card foi removido do deck.',
          duration: 3000,
        });

        // Close modal and call success callback
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error('Erro ao deletar card', {
          description: result.error || 'Não foi possível deletar o card.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Erro ao deletar card:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🗑️ Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Tem certeza que deseja deletar este card?
            <br />
            <span className="font-medium text-foreground">
              Esta ação não pode ser desfeita.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? 'Deletando...' : 'Deletar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}