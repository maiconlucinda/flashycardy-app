import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { AuthWrapper } from "@/components/auth-wrapper";

export default function Home() {
  return (
    <AuthWrapper>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-6xl font-bold mb-4">
              FlashyCardy
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Your personal flashcard platform
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <SignInButton mode="modal">
              <Button size="lg">
                Sign In
              </Button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <Button variant="outline" size="lg">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
