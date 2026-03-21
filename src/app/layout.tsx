'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { FirebaseClientProvider, useUser, useFirestore, useAuth } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Poppins as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeProvider } from '@/components/theme-provider';

const fontSans = FontSans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Nsp Manager</title>
        <meta name="description" content="NSP Management and Monthly Submission System" />
      </head>
      <body className={cn('antialiased font-sans', fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <FirebaseClientProvider>
            <AuthGuard>
              <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-12 bg-transparent">
                <div className="flex w-full max-w-[1400px] h-[90vh] bg-background/80 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5),0_0_120px_rgba(130,0,200,0.1)] border border-white/5 relative z-10">
                  <Sidebar />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                      {children}
                    </main>
                  </div>
                </div>
              </div>
            </AuthGuard>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'approved' | 'pending' | 'no-user'>('loading');

  useEffect(() => {
    if (isUserLoading) {
      setStatus('loading');
      return;
    }

    if (!user) {
      setStatus('no-user');
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }
    
    // User is authenticated, check their status in Firestore
    const checkUserStatus = async () => {
      if (!firestore) return;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().status === 'Active') {
        setStatus('approved');
        if (pathname === '/login') {
          router.replace('/');
        }
      } else {
        setStatus('pending');
      }
    };
    checkUserStatus();

  }, [user, isUserLoading, router, pathname, firestore]);

  if (status === 'loading' || (status !== 'no-user' && pathname === '/login')) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="w-full max-w-sm space-y-4 rounded-xl p-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
  }
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (status === 'pending') {
    return <PendingApprovalPage />;
  }

  if (status === 'approved') {
    return <>{children}</>;
  }

  return null; // Should be handled by redirects
}

function PendingApprovalPage() {
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if(auth) {
            await auth.signOut();
        }
        router.push('/login');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
             <Card className="mx-auto max-w-md w-full shadow-2xl shadow-black/10">
                <CardHeader>
                    <CardTitle>Account Pending Approval</CardTitle>
                    <CardDescription>
                        Your account has been created successfully but requires administrator approval.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Pending Status</AlertTitle>
                        <AlertDescription>
                            Please contact your district administrator to activate your account. You will not be able to access the system until your account is approved.
                        </AlertDescription>
                    </Alert>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Logged in as: <span className="font-medium">{user?.email}</span>
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>Log Out</Button>
                </CardFooter>
             </Card>
        </div>
    )
}
