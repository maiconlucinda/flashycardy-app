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
import { createDeckAction } from '@/actions/deck-actions';
import { toast } from 'sonner';
import { Plus, Crown } from 'lucide-react';
import Link from 'next/link';

interface CreateDeckModalProps {
  triggerButton?: React.ReactNode;
}

export function CreateDeckModal({ triggerButton }: CreateDeckModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setError(null);
    setRequiresUpgrade(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setRequiresUpgrade(false);

    try {
      const result = await createDeckAction({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      if (result.success) {
        toast.success('Deck created successfully!');
        setOpen(false);
        resetForm();
      } else {
        setError(result.error || 'Failed to create deck');
        setRequiresUpgrade(result.requiresUpgrade || false);
      }
    } catch (error) {
      console.error('Create deck error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="w-4 h-4 mr-2" />
      New Deck
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Create a new flashcard deck to start learning.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              requiresUpgrade ? (
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium">Upgrade to Pro Required</span>
                      <span className="text-sm">{error}</span>
                      <Button asChild size="sm" className="w-fit">
                        <Link href="/pricing">View Pricing</Link>
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )
            )}
            <div className="grid gap-2">
              <Label htmlFor="title">Title*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter deck title..."
                maxLength={255}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter deck description (optional)..."
                maxLength={1000}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Deck'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}