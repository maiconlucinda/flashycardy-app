'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDeckAction } from '@/actions/deck-actions';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

interface DeleteDeckModalProps {
  deckId: number;
  deckTitle: string;
  triggerButton?: React.ReactNode;
}

export function DeleteDeckModal({ deckId, deckTitle, triggerButton }: DeleteDeckModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteDeckAction({ id: deckId });
      
      if (result.success) {
        setIsOpen(false);
        // Redirect to dashboard after successful deletion
        router.push('/dashboard');
      } else {
        console.error('Failed to delete deck:', result.error);
        // Could show a toast notification here if needed
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button 
            variant="destructive" 
            size="sm"
            className="text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Deck
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Deck</DialogTitle>
          <DialogDescription className="text-base">
            Are you sure you want to delete <strong>{deckTitle}</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>This action cannot be undone.</strong> This will permanently delete the deck and all its flashcards.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive-foreground"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Deck
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}