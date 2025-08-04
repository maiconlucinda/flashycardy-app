'use server';

import { auth } from '@clerk/nextjs/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { createCards } from '@/db/queries/cards';
import { getDeckById } from '@/db/queries/decks';
import { revalidatePath } from 'next/cache';

// Zod schema for AI generation input
const GenerateFlashcardsSchema = z.object({
  deckId: z.number().positive('Invalid deck ID'),
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long'),
  count: z.number().min(1).max(20, 'Maximum 20 cards per generation').default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  cardType: z.enum(['general', 'language', 'vocabulary', 'definitions']).optional().default('general'),
  sourceLanguage: z.string().optional().default('português'),
  targetLanguage: z.string().optional().default('inglês'),
});

// Schema for the AI-generated flashcards
const FlashcardGenerationSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string().min(1, 'Front side cannot be empty'),
    back: z.string().min(1, 'Back side cannot be empty'),
  })).min(1, 'Must generate at least one flashcard'),
});

type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;

export async function generateFlashcardsWithAI(input: GenerateFlashcardsInput) {
  // 1. Validate input
  const validatedInput = GenerateFlashcardsSchema.parse(input);
  
  // 2. Authenticate user and check billing
  const { userId, has } = await auth();
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  // 3. Check billing/feature access
  const hasAIGeneration = has({ feature: 'ai_flashcard_generation' });
  if (!hasAIGeneration) {
    return {
      success: false,
      error: 'AI flashcard generation requires a Pro subscription.',
      requiresUpgrade: true
    };
  }

  // 4. Verify deck ownership
  const deck = await getDeckById(validatedInput.deckId, userId);
  if (!deck) {
    return {
      success: false,
      error: 'Deck not found or unauthorized'
    };
  }

  // 5. Validate deck has description for better AI generation
  if (!deck.description || deck.description.trim().length === 0) {
    return {
      success: false,
      error: 'Deck description is required for AI generation. The description helps AI understand context and create more relevant flashcards.',
      requiresDescription: true
    };
  }

  try {
    // 6. Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'AI generation is temporarily unavailable. Please try again later.',
        requiresSetup: true
      };
    }

    // 7. Construct the prompt based on card type
    const topic = validatedInput.topic || deck.title;
    const additionalContext = deck.description ? `Additional context: ${deck.description}` : '';
    
    let prompt = '';
    
    switch (validatedInput.cardType) {
      case 'language':
        prompt = `Generate ${validatedInput.count} flashcards for language learning.
${additionalContext}
Topic/Theme: ${topic}
Source language (front of cards): ${validatedInput.sourceLanguage}
Target language (back of cards): ${validatedInput.targetLanguage}
Difficulty level: ${validatedInput.difficulty}

IMPORTANT REQUIREMENTS FOR LANGUAGE LEARNING:
- Front of card: Write words, phrases, or sentences in ${validatedInput.sourceLanguage}
- Back of card: Write the translation in ${validatedInput.targetLanguage}
- Focus on practical, useful vocabulary and phrases
- Include common words and expressions that learners would encounter
- For ${validatedInput.difficulty} difficulty:
  * easy: Basic words and simple phrases
  * medium: Common phrases and intermediate vocabulary
  * hard: Complex sentences and advanced vocabulary
- Ensure translations are accurate and natural
- Avoid overly literal translations - use natural expressions

Example format:
Front: "Como você está?" (in ${validatedInput.sourceLanguage})
Back: "How are you?" (in ${validatedInput.targetLanguage})`;
        break;
        
      case 'vocabulary':
        prompt = `Generate ${validatedInput.count} vocabulary flashcards for the topic: "${topic}".
${additionalContext}
Difficulty level: ${validatedInput.difficulty}

REQUIREMENTS FOR VOCABULARY CARDS:
- Front of card: A word or term related to the topic
- Back of card: Clear definition, explanation, and usage example
- Focus on key terminology and important concepts
- Include words that are essential for understanding the topic
- For ${validatedInput.difficulty} difficulty, adjust vocabulary complexity
- Provide context and practical usage examples

Example format:
Front: "Algorithm"
Back: "A step-by-step procedure for solving a problem or completing a task. Example: 'The sorting algorithm arranges data in ascending order.'"`;
        break;
        
      case 'definitions':
        prompt = `Generate ${validatedInput.count} definition flashcards for the topic: "${topic}".
${additionalContext}
Difficulty level: ${validatedInput.difficulty}

REQUIREMENTS FOR DEFINITION CARDS:
- Front of card: A concept, term, or principle
- Back of card: Comprehensive definition with explanation
- Focus on key concepts and important principles
- Explain the significance and applications
- For ${validatedInput.difficulty} difficulty, adjust concept complexity
- Make definitions clear and educational

Example format:
Front: "Photosynthesis"
Back: "The process by which plants use sunlight, carbon dioxide, and water to produce glucose and oxygen. This process is essential for plant growth and provides oxygen for most life on Earth."`;
        break;
        
      default: // 'general'
        prompt = `Generate ${validatedInput.count} flashcards for the topic: "${topic}".
${additionalContext}
Difficulty level: ${validatedInput.difficulty}

GENERAL REQUIREMENTS:
- Each flashcard should have a clear, concise question on the front
- The back should contain a comprehensive but focused answer
- Questions should test understanding, not just memorization
- Avoid overly complex or ambiguous phrasing
- Ensure content is educationally valuable
- For ${validatedInput.difficulty} difficulty, adjust complexity appropriately
- Make sure the content is appropriate for studying

Example format:
Front: "What is the main function of the mitochondria?"
Back: "The mitochondria is the powerhouse of the cell, responsible for producing ATP (energy) through cellular respiration."`;
    }
    
    prompt += `

Topic: ${topic}
Generate exactly ${validatedInput.count} flashcards.`;

    // 8. Generate flashcards using Vercel AI
    // Note: Using gpt-4o-mini as it supports structured output with JSON schema
    // Alternative models: 'gpt-4o', 'gpt-4-turbo' (but not base 'gpt-4')
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: FlashcardGenerationSchema,
      prompt: prompt,
      temperature: 0.7, // Add some creativity while maintaining consistency
    });

    // 9. Validate generated content
    if (!object.flashcards || object.flashcards.length === 0) {
      return {
        success: false,
        error: 'No flashcards were generated'
      };
    }

    // 10. Filter out any invalid cards
    const validCards = object.flashcards.filter(card => 
      card.front.trim().length > 0 && 
      card.back.trim().length > 0 &&
      card.front !== card.back
    );

    if (validCards.length === 0) {
      return {
        success: false,
        error: 'All generated flashcards were invalid'
      };
    }

    // 11. Save generated cards to database
    const newCards = await createCards(
      validCards.map(card => ({
        front: card.front.trim(),
        back: card.back.trim(),
        deckId: validatedInput.deckId,
      })),
      userId
    );

    // 12. Revalidate the deck page
    revalidatePath(`/decks/${validatedInput.deckId}`);

    return {
      success: true,
      cards: newCards,
      count: newCards.length
    };
  } catch (error) {
    console.error('Error generating flashcards:', error);
    
    // Handle specific AI errors
    if (error instanceof Error) {
      console.error('Detailed error:', error.message);
      
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return { 
          success: false, 
          error: 'AI service is busy. Please try again in a moment.' 
        };
      }
      
      if (error.message.includes('content filter')) {
        return { 
          success: false, 
          error: 'Content was filtered. Please try a different topic.' 
        };
      }
      
      if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
        return { 
          success: false, 
          error: 'AI generation is temporarily unavailable. Please try again later.' 
        };
      }
      
      if (error.message.includes('network') || error.message.includes('ECONNRESET')) {
        return { 
          success: false, 
          error: 'Connection error. Please check your internet connection and try again.' 
        };
      }
      
      if (error.message.includes('quota') || error.message.includes('billing') || error.message.includes('insufficient_quota')) {
        return { 
          success: false, 
          error: 'AI generation is temporarily unavailable. Please try again later.' 
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to generate flashcards. Please try again.'
    };
  }
}