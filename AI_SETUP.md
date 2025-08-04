# AI Flashcard Generation Setup

This document explains how to set up AI flashcard generation in your Flashcardy app.

## Quick Setup

If you're getting the error "Failed to generate flashcards", it's likely because your OpenAI API key is not configured.

### Step 1: Create Environment File

Create a `.env.local` file in your project root with the following content:

```env
# Database (your existing value)
DATABASE_URL=your_database_url_here

# Clerk Authentication (your existing values)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# OpenAI API Key for AI Flashcard Generation
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 2: Get an OpenAI API Key

1. Go to [OpenAI's API Keys page](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. Replace `your_openai_api_key_here` in your `.env.local` file

### Step 3: Restart Your Development Server

After adding the API key, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## How It Works

The AI flashcard generation feature:

- **Billing Protected**: Only available to users with the `ai_flashcard_generation` feature (Pro plan)
- **Generates 20 cards**: Creates 20 flashcards based on the deck title and description
- **Uses GPT-4o-mini**: Leverages OpenAI's GPT-4o-mini model for high-quality, cost-effective content generation
- **Structured Output**: Uses JSON schema to ensure consistent flashcard format
- **Contextual**: Uses the deck title as the primary topic and description as additional context
- **Educational Focus**: Generates cards that test understanding rather than just memorization

## Usage

1. Navigate to any deck page
2. Look for the "AI Flashcard Generation" card in the Cards section
3. Pro users will see a "Generate 20 Cards with AI" button
4. Free users will see an upgrade prompt with a link to the pricing page
5. Click the button to generate flashcards based on the deck topic

## Error Handling

The system handles various scenarios:

- **Rate limiting**: Shows user-friendly message when OpenAI API is busy
- **Content filtering**: Informs users if content was filtered
- **Invalid cards**: Filters out empty or duplicate content
- **Network errors**: Provides generic error message for unexpected issues

## Features

- **Real-time generation**: Cards are generated and saved immediately
- **Deck ownership validation**: Ensures users can only generate cards for their own decks
- **Billing integration**: Seamlessly integrates with Clerk's billing system
- **Toast notifications**: Provides feedback on success/failure
- **Automatic revalidation**: Updates the page to show new cards without refresh

## Troubleshooting

### Model Compatibility Error
If you see an error like `'text.format' of type 'json_schema' is not supported with model version 'gpt-4'`, this means the model doesn't support structured output.

**Solution**: The app now uses `gpt-4o-mini` which supports structured output. If you need to change models, use:
- ✅ `gpt-4o-mini` (recommended - cost-effective)
- ✅ `gpt-4o` (higher quality, more expensive)
- ✅ `gpt-4-turbo` (good balance)
- ❌ `gpt-4` (base model - doesn't support structured output)

### Rate Limiting
If you see "AI service is busy", you've hit OpenAI's rate limits. Wait a few minutes and try again.

### API Key Issues
- Make sure your API key starts with `sk-`
- Ensure you have credits in your OpenAI account
- Check that the API key has the necessary permissions