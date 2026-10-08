'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';
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
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center border-b-0 text-center">
        {status === 'loading' && (
          <>
            <Loader className="mb-2 size-10 animate-spin text-muted-foreground" aria-hidden="true" />
            <CardTitle>Confirmando email</CardTitle>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mb-2 size-10 text-success" aria-hidden="true" />
            <CardTitle>¡Listo!</CardTitle>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="mb-2 size-10 text-destructive" aria-hidden="true" />
            <CardTitle>Error</CardTitle>
          </>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <p role="status" className="text-sm text-muted-foreground text-pretty">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader className="size-8 animate-spin text-muted-foreground" aria-label="Cargando" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
