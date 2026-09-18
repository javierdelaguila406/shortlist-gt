'use client';

import { useState } from 'react';
import { useLicenseCode } from '@/lib/license-system';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface UseLicenseCodeModalProps {
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UseLicenseCodeModal({ userId, onClose, onSuccess }: UseLicenseCodeModalProps) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await useLicenseCode(codigo, userId);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Recargar la página para reflejar el nuevo plan
        window.location.reload();
      }, 1500);
    } else {
      setError(result.message || 'Error al procesar el código');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Activar Premium</CardTitle>
            <CardDescription>Ingresa tu código de licencia</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white">¡Acceso Premium Activado!</h3>
              <p className="text-sm text-zinc-400">
                Tu cuenta ha sido actualizada exitosamente.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Código de Licencia
                </label>
                <input
                  type="text"
                  value={codigo.toUpperCase()}
                  onChange={(e) => {
                    setCodigo(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="Ej: SHORTLIST-2024-ABC123"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                <p className="text-xs text-zinc-400">
                  💡 <strong>Tip:</strong> Tu código de licencia es único y se puede usar solo una vez.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !codigo.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? 'Validando...' : 'Activar'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
