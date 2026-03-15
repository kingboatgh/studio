'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NSP Digital Submissions</title>
        <meta name="description" content="NSP Management and Monthly Submission System" />
      </head>
      <body className="antialiased">
        <FirebaseClientProvider>
            <AuthGuard>
              <div className="flex min-h-screen w-full bg-secondary">
                <Sidebar />
                <div className="flex flex-1 flex-col">
                  <Header />
                  <main className="flex-1 p-4 md:p-8 lg:p-12">
                    {children}
                  </main>
                </div>
              </div>
            </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
    if (!isUserLoading && user && pathname === '/login') {
      router.replace('/');
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || (!user && pathname !== '/login') || (user && pathname === '/login')) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-4 rounded-xl p-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
  }
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return <>{children}</>;
}
