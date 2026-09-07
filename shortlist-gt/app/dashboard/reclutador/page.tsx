'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, LogOut, Briefcase, Mail, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tab = 'dashboard' | 'plazas' | 'postulaciones' | 'evaluaciones';

export default function ReclutadorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('reclutador_token');
    const email = localStorage.getItem('reclutador_email');
    if (!token || !email) {
      router.push('/auth/login');
      return;
    }
    setIsAuthenticated(true);
    setUserEmail(email);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('reclutador_token');
      localStorage.removeItem('reclutador_email');
      router.push('/auth/login');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">SHORTLIST.GT Dashboard v2</h1>
            <p className="text-zinc-400">Panel de Reclutador - 4 Tabs</p>
            {userEmail && <p className="text-sm text-zinc-500 mt-2">Cuenta: {userEmail}</p>}
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'plazas', label: '💼 Plazas' },
            { id: 'postulaciones', label: '📧 Postulaciones' },
            { id: 'evaluaciones', label: '📋 Evaluaciones' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as Tab)}
              className={`px-4 py-3 border-b-2 ${
                activeTab === id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Plazas Activas', value: '2' },
              { label: 'Postulaciones', value: '12' },
              { label: 'En Revisión', value: '8' },
              { label: 'Aprobados', value: '2' },
            ].map(({ label, value }) => (
              <Card key={label} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="text-3xl font-bold text-white">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'plazas' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Gestión de Plazas</h2>
            <Button className="mb-6"><Plus className="w-4 h-4 mr-2" /> Nueva Plaza</Button>
            <div className="space-y-4">
              {[
                { titulo: 'Desarrollador Senior React', desc: '5+ años', posts: 12 },
                { titulo: 'Product Manager', desc: 'Startup tech', posts: 8 },
              ].map((p) => (
                <Card key={p.titulo} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold text-white">{p.titulo}</h3>
                    <p className="text-sm text-zinc-400">{p.desc}</p>
                    <p className="text-sm text-emerald-400 mt-2">{p.posts} postulaciones</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'postulaciones' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Postulaciones</h2>
            <div className="space-y-3">
              {[
                { nombre: 'Víctor Barillas', email: 'victor@gmail.com', score: 93 },
                { nombre: 'Sofía Morales', email: 'sofia@gmail.com', score: 87 },
              ].map((c) => (
                <Card key={c.email} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{c.nombre}</h3>
                      <p className="text-sm text-emerald-400">{c.email}</p>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">{c.score}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'evaluaciones' && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-center py-8">
                📊 Evaluaciones de WhatsApp aquí
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
