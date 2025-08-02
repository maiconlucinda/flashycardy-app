'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateCardAction } from '@/actions/card-actions';
import { toast } from 'sonner';
import { DeleteCardModal } from '@/components/delete-card-modal';

interface EditCardModalProps {
  card: {
    id: number;
    front: string;
    back: string;
    deckId: number;
  };
  triggerButton?: React.ReactNode;
}

export function EditCardModal({ card, triggerButton }: EditCardModalProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (open) {
      setFront(card.front);
      setBack(card.back);
      setError(null);
    }
  }, [open, card.front, card.back]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateCardAction({
        id: card.id,
        front: front.trim(),
        back: back.trim(),
      });

      if (result.success) {
        // Show success notification
        toast.success('Card atualizado com sucesso! 🎉', {
          description: 'Suas alterações foram salvas.',
          duration: 3000,
        });

        // Close modal
        setOpen(false);
      } else {
        setError(result.error || 'Falha ao atualizar card');
      }
    } catch (err) {
      console.error('Erro ao atualizar card:', err);
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    // Close the edit modal when card is deleted
    setOpen(false);
  };

  const isFormValid = front.trim().length > 0 && back.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            Editar Card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Card</DialogTitle>
            <DialogDescription>
              Atualize a pergunta e resposta do seu card de estudo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="card-front">Pergunta/Frente do Card *</Label>
              <Textarea
                id="card-front"
                placeholder="Digite a pergunta ou conceito..."
                value={front}
                onChange={(e) => setFront(e.target.value)}
                disabled={isSubmitting}
                maxLength={2000}
                rows={3}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {front.length}/2000 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-back">Resposta/Verso do Card *</Label>
              <Textarea
                id="card-back"
                placeholder="Digite a resposta ou definição..."
                value={back}
                onChange={(e) => setBack(e.target.value)}
                disabled={isSubmitting}
                maxLength={2000}
                rows={3}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {back.length}/2000 caracteres
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isSubmitting}
              className="mr-auto"
            >
              Deletar Card
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Delete confirmation modal */}
      <DeleteCardModal
        cardId={card.id}
        deckId={card.deckId}
        isOpen={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onSuccess={handleDeleteSuccess}
      />
    </Dialog>
  );
}