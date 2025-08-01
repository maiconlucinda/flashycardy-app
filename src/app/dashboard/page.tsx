import { SignedIn } from "@clerk/nextjs";

export default function Dashboard() {
  return (
    <SignedIn>
      <div className="min-h-screen p-8">
        <main className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-8">
              Welcome back to FlashCardy!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Ready to continue learning with your flashcards?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2">Create Deck</h3>
                <p className="text-gray-600 dark:text-gray-300">Start a new flashcard deck</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2">Study</h3>
                <p className="text-gray-600 dark:text-gray-300">Practice with existing decks</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2">Progress</h3>
                <p className="text-gray-600 dark:text-gray-300">Track your learning progress</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SignedIn>
  );
}