'use client';

import { useState, useEffect } from 'react';
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
import { updateDeckAction } from '@/actions/deck-actions';
import { toast } from 'sonner';

interface EditDeckModalProps {
  deck: {
    id: number;
    title: string;
    description: string | null;
  };
  triggerButton?: React.ReactNode;
}

export function EditDeckModal({ deck, triggerButton }: EditDeckModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when deck changes or modal opens
  useEffect(() => {
    if (open) {
      setTitle(deck.title);
      setDescription(deck.description || '');
      setError(null);
    }
  }, [open, deck.title, deck.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateDeckAction({
        id: deck.id,
        title: title.trim(),
        description: description.trim(),
      });

      if (result.success) {
        // Show success notification
        toast.success('Deck updated successfully! 🎉', {
          description: 'Your changes have been saved.',
          duration: 3000,
        });

        // Close modal
        setOpen(false);
      } else {
        setError(result.error || 'Failed to update deck');
      }
    } catch (err) {
      console.error('Error updating deck:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            Edit Deck
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>
              Update your deck information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="deck-title">Title *</Label>
              <Input
                id="deck-title"
                placeholder="Enter deck title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                maxLength={255}
                required
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/255 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deck-description">Description</Label>
              <Textarea
                id="deck-description"
                placeholder="Enter deck description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={1000}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}