'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Building } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function LoginPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <Card className="shadow-2xl shadow-black/10">
          <CardHeader className="text-center p-6">
            <div className="flex justify-center items-center gap-2 mb-4">
               <div className="bg-primary p-2 rounded-lg">
                 <Building className="h-5 w-5 text-primary-foreground" />
               </div>
               <h1 className="text-sm font-bold tracking-tight">Nsp Manager</h1>
            </div>
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <TabsContent value="login" className="mt-0">
              <LoginForm setPending={setIsPending} setError={setError} isPending={isPending} />
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <SignUpForm setPending={setIsPending} setError={setError} isPending={isPending} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

// Login Form Component
function LoginForm({ setPending, setError, isPending }: { setPending: (p: boolean) => void, setError: (e: string | null) => void, isPending: boolean}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const auth = useAuth();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const { setPersistence, browserSessionPersistence } = await import('firebase/auth');
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  };
  return (
    <form onSubmit={handleLogin} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full mt-2" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  )
}

// Sign Up Form Component
function SignUpForm({ setPending, setError, isPending }: { setPending: (p: boolean) => void, setError: (e: string | null) => void, isPending: boolean }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile in Auth
      await updateProfile(user, { displayName: fullName });

      // Create user profile in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        role: 'Desk Officer',
        status: 'Pending',
        districtId: null,
        createdAt: serverTimestamp()
      });

      // Show a pending approval message and redirect
      alert('Sign up successful! Your account is pending approval by an administrator. You will be redirected to the login page.');
      router.push('/login');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  };

  return (
     <form onSubmit={handleSignUp} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input id="signup-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? 'Creating Account...' : 'Sign Up'}
        </Button>
    </form>
  )
}
