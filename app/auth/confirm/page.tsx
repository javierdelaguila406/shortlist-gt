'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando tu email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || !type) {
          setStatus('error');
          setMessage('Link de confirmación inválido');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // Usar el método de Supabase para verificar el token
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'email' | 'email_change' | 'phone_change' | 'recovery' | 'magic_link' | 'invite_accept',
        });

        if (error) {
          throw error;
        }

        setStatus('success');
        setMessage('¡Email confirmado! Te redirigiremos al login en 3 segundos...');

        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } catch (err: any) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setMessage(err.message || 'Error al confirmar email. Intenta de nuevo.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
              <CardTitle>Confirmando Email</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <CardTitle>¡Listo!</CardTitle>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Error</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-zinc-400 text-sm">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <Loader className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
