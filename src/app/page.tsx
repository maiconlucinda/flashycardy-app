import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check authentication on the server side
  const { userId } = await auth();
  
  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // If not authenticated, show the landing page
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">
            Welcome to FlashCardy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your personal flashcard learning app
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Sign in to start creating and studying your flashcards!
          </p>
        </div>
      </main>
    </div>
  );
}
