import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import {
  ClerkProvider,
  SignedIn,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "FlashyCardy - Personal Flashcard Learning App",
  description: "Your personal flashcard learning app powered by Clerk authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{colorScheme: "dark"}}>
      <body className={`${poppins.variable} antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "oklch(0.488 0.243 264.376)",
              colorBackground: "oklch(0.145 0 0)",
              colorInputBackground: "oklch(0.205 0 0)",
              colorInputText: "oklch(0.985 0 0)",
              colorText: "oklch(0.985 0 0)",
              colorTextSecondary: "oklch(0.708 0 0)",
              colorNeutral: "oklch(0.556 0 0)",
            },
            elements: {
              card: "bg-card border-border shadow-lg",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          dynamic
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <header className="border-b border-gray-200 dark:border-gray-800 p-4">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  FlashyCardy
                </Link>
                <div className="flex items-center gap-4">
                  <SignedIn>
                    <nav className="flex items-center gap-4">
                      <Link href="/dashboard" className="text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        Dashboard
                      </Link>
                    </nav>
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        baseTheme: dark,
                        elements: {
                          avatarBox: "h-8 w-8",
                          userButtonPopoverCard: "bg-card border-border shadow-lg",
                          userButtonPopoverMain: "bg-card",
                          userButtonPopoverActionButton: "text-foreground hover:bg-accent",
                          userButtonPopoverActionButtonText: "text-foreground",
                          userButtonPopoverFooter: "border-border",
                        },
                        variables: {
                          colorBackground: "oklch(0.145 0 0)",
                          colorText: "oklch(0.985 0 0)",
                        },
                      }}
                    />
                  </SignedIn>
                </div>
              </div>
            </header>
            {children}
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
