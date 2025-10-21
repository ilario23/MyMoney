import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wallet, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth.store';
import { db } from '@/lib/dexie';

export function SignupPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError(t('auth.fillAllFields'));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return false;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return false;
    }

    if (displayName.length < 2) {
      setError(t('auth.nameTooShort'));
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Crea l'account su Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError(t('auth.signupError'));
        return;
      }

      const userId = data.user.id;
      const userEmail = data.user.email!;

      // 2. Crea l'utente nel database locale (Dexie)
      await db.users.add({
        id: userId,
        email: userEmail,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2b. Crea l'utente anche in Supabase per evitare foreign key errors
      console.log('📝 Attempting to create user in Supabase...');
      const { error: userError, data: userData } = await supabase.from('users').insert({
        id: userId,
        email: userEmail,
        display_name: displayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (userError) {
        console.error('❌ Error creating user in Supabase:', userError);
        console.error('Error code:', userError.code);
        console.error('Error details:', userError.details);
        console.error('Error message:', userError.message);
        setError(`Failed to create user in database: ${userError.message}. Code: ${userError.code}`);
        return;
        // Interrompiamo il signup se il user non viene creato
      }

      console.log('✅ User created successfully in Supabase', userData);

      setSuccess(true);

      // 3. Login automatico
      setTimeout(() => {
        setUser({
          id: userId,
          email: userEmail,
          displayName,
        });

        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setError(t('auth.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-3xl font-bold">
            <Wallet className="w-8 h-8 text-primary" />
            <span>ExpenseTracker</span>
          </div>
        </div>

        {/* Card */}
        <Card className="border-border">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{t('auth.signup')}</CardTitle>
            <CardDescription>
              {t('auth.signupDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {t('auth.signupSuccess')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.name')}</label>
                <Input
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading || success}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.email')}</label>
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || success}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.password')}</label>
                <Input
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || success}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.passwordHint')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.confirmPassword')}</label>
                <Input
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || success}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
                size="lg"
              >
                {isLoading ? t('auth.signingUp') : t('auth.signup')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t('auth.hasAccount')}{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline font-medium"
                disabled={isLoading || success}
              >
                {t('auth.login')}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
          <div>{t('auth.mobileFriendly')}</div>
          <div>{t('auth.offline')}</div>
          <div>{t('auth.secure')}</div>
        </div>
      </div>
    </div>
  );
}
