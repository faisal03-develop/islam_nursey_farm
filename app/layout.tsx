import type { Metadata } from 'next'
import { ClerkProvider, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { Inter } from 'next/font/google';
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: "Islam Nursery Farm | Management System",
  description:
    "Full-featured nursery farm management: inventory, sales, purchases, customers, and analytics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <header className="auth-header">
            {!userId ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <SignInButton mode="modal">
                  <button className="btn btn-ghost btn-sm">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary btn-sm">Sign Up</button>
                </SignUpButton>
              </div>
            ) : (
              <UserButton />
            )}
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
