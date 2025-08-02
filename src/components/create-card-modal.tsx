'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { createCardAction } from '@/actions/card-actions';
import { toast } from 'sonner';

interface CreateCardModalProps {
  deckId: number;
  triggerButton?: React.ReactNode;
}

export function CreateCardModal({ deckId, triggerButton }: CreateCardModalProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCardAction({
        front: front.trim(),
        back: back.trim(),
        deckId,
      });

      if (result.success) {
        // Mostrar notificação de sucesso
        toast.success('Card criado com sucesso! 🎉', {
          description: 'Seu novo flashcard foi adicionado ao deck.',
          duration: 3000,
        });
        
        // Limpar formulário e fechar modal
        setFront('');
        setBack('');
        setOpen(false);
      } else {
        setError(result.error || 'Erro desconhecido');
        // Mostrar notificação de erro
        toast.error('Erro ao criar card', {
          description: result.error || 'Algo deu errado. Tente novamente.',
          duration: 4000,
        });
      }
    } catch (err) {
      console.error('Erro ao submeter:', err);
      setError('Erro ao criar card. Tente novamente.');
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Limpar erro ao fechar
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            Adicionar Card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Card</DialogTitle>
          <DialogDescription>
            Adicione uma nova pergunta e resposta ao seu deck de estudo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Pergunta/Frente do Card</Label>
            <Textarea
              id="front"
              placeholder="Digite a pergunta ou conceito..."
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="back">Resposta/Verso do Card</Label>
            <Textarea
              id="back"
              placeholder="Digite a resposta ou definição..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
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
              disabled={isSubmitting || !front.trim() || !back.trim()}
            >
              {isSubmitting ? 'Criando...' : 'Criar Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}