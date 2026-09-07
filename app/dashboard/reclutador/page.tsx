'use client';

// Dashboard v2 - Complete rebuild
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, BarChart3, Settings, LogOut, Briefcase, Mail, Phone, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tab = 'dashboard' | 'plazas' | 'postulaciones' | 'evaluaciones';

interface Vacante {
  id: string;
  titulo: string;
  descripcion: string;
  departamento: string;
  estado: 'activa' | 'pausada' | 'cerrada';
  postulaciones: number;
  creada: string;
}

interface Candidato {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  vacante: string;
  score_cv: number | null;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  fecha_aplicacion: string;
}

export default function ReclutadorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showNewVacanteForm, setShowNewVacanteForm] = useState(false);
  const router = useRouter();

  // Demo data
  const [vacantes, setVacantes] = useState<Vacante[]>([
    {
      id: '1',
      titulo: 'Desarrollador Senior React',
      descripcion: 'Buscamos un desarrollador con 5+ años de experiencia en React',
      departamento: 'Tecnología',
      estado: 'activa',
      postulaciones: 12,
      creada: '2026-09-01',
    },
    {
      id: '2',
      titulo: 'Product Manager',
      descripcion: 'Gestión de producto en startup tech',
      departamento: 'Producto',
      estado: 'activa',
      postulaciones: 8,
      creada: '2026-08-25',
    },
  ]);

  const [candidatos, setCandidatos] = useState<Candidato[]>([
    {
      id: '1',
      nombre: 'Víctor Barillas',
      email: 'victor.barillas@gmail.com',
      telefono: '+502 7123 4567',
      vacante: 'Desarrollador Senior React',
      score_cv: 93,
      estado: 'en_revision',
      fecha_aplicacion: '2026-09-05',
    },
    {
      id: '2',
      nombre: 'Sofía Morales',
      email: 'sofia.morales@gmail.com',
      telefono: '+502 7234 5678',
      vacante: 'Desarrollador Senior React',
      score_cv: 87,
      estado: 'pendiente',
      fecha_aplicacion: '2026-09-04',
    },
  ]);

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
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('reclutador_token');
      localStorage.removeItem('reclutador_email');
      router.push('/auth/login');
    }
  };

  const handleNewVacante = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVacante: Vacante = {
      id: Date.now().toString(),
      titulo: formData.get('titulo') as string,
      descripcion: formData.get('descripcion') as string,
      departamento: formData.get('departamento') as string,
      estado: 'activa',
      postulaciones: 0,
      creada: new Date().toISOString().split('T')[0],
    };
    setVacantes([...vacantes, newVacante]);
    setShowNewVacanteForm(false);
    (e.target as HTMLFormElement).reset();
  };

  if (!isAuthenticated) {
    return null;
  }

  const statsCards = [
    { label: 'Plazas Activas', value: vacantes.filter(v => v.estado === 'activa').length, icon: Briefcase },
    { label: 'Total Postulaciones', value: candidatos.length, icon: Mail },
    { label: 'En Revisión', value: candidatos.filter(c => c.estado === 'en_revision').length, icon: FileText },
    { label: 'Aprobados', value: candidatos.filter(c => c.estado === 'aprobado').length, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">SHORTLIST.GT</h1>
            <p className="text-zinc-400">Dashboard de Reclutador</p>
            {userEmail && <p className="text-sm text-zinc-500 mt-2">Cuenta: <span className="text-emerald-400">{userEmail}</span></p>}
          </div>
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          {[
            { tab: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
            { tab: 'plazas' as Tab, label: 'Plazas', icon: Briefcase },
            { tab: 'postulaciones' as Tab, label: 'Postulaciones', icon: Mail },
            { tab: 'evaluaciones' as Tab, label: 'Evaluaciones', icon: FileText },
          ].map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 flex gap-2 items-center border-b-2 transition ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {statsCards.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">{label}</p>
                        <p className="text-3xl font-bold text-white">{value}</p>
                      </div>
                      <Icon className="w-8 h-8 text-emerald-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Plazas Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vacantes.slice(0, 3).map((vacante) => (
                      <div key={vacante.id} className="p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white">{vacante.titulo}</h4>
                            <p className="text-sm text-zinc-400">{vacante.postulaciones} postulaciones</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            vacante.estado === 'activa' ? 'bg-emerald-950 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {vacante.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Postulaciones Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {candidatos.slice(0, 3).map((candidato) => (
                      <div key={candidato.id} className="p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white">{candidato.nombre}</h4>
                            <p className="text-xs text-zinc-400">{candidato.vacante}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-400">{candidato.score_cv || '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PLAZAS TAB */}
        {activeTab === 'plazas' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestión de Plazas</h2>
              <Button className="gap-2" onClick={() => setShowNewVacanteForm(!showNewVacanteForm)}>
                <Plus className="w-4 h-4" />
                Nueva Plaza
              </Button>
            </div>

            {showNewVacanteForm && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Crear Nueva Plaza</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNewVacante} className="space-y-4">
                    <input
                      type="text"
                      name="titulo"
                      placeholder="Título de la plaza"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500"
                      required
                    />
                    <textarea
                      name="descripcion"
                      placeholder="Descripción de la plaza"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500"
                      rows={3}
                      required
                    />
                    <input
                      type="text"
                      name="departamento"
                      placeholder="Departamento"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Crear Plaza</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewVacanteForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {vacantes.map((vacante) => (
                <Card key={vacante.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{vacante.titulo}</h3>
                        <p className="text-sm text-zinc-400 mt-1">{vacante.descripcion}</p>
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="text-zinc-500">Dpto: <span className="text-white">{vacante.departamento}</span></span>
                          <span className="text-zinc-500">Postulaciones: <span className="text-emerald-400">{vacante.postulaciones}</span></span>
                          <span className="text-zinc-500">Creada: <span className="text-white">{vacante.creada}</span></span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded text-sm ${
                          vacante.estado === 'activa' ? 'bg-emerald-950 text-emerald-300' :
                          vacante.estado === 'pausada' ? 'bg-amber-950 text-amber-300' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {vacante.estado}
                        </span>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* POSTULACIONES TAB */}
        {activeTab === 'postulaciones' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Postulaciones</h2>
            <div className="grid gap-4">
              {candidatos.map((candidato) => (
                <Card key={candidato.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-bold text-white">{candidato.nombre}</h3>
                        <a href={`mailto:${candidato.email}`} className="text-sm text-emerald-400 hover:text-emerald-300">
                          {candidato.email}
                        </a>
                        <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {candidato.telefono}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Posición</p>
                        <p className="text-white">{candidato.vacante}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Score CV</p>
                        <p className="text-2xl font-bold text-emerald-400">{candidato.score_cv || '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded text-sm ${
                          candidato.estado === 'aprobado' ? 'bg-emerald-950 text-emerald-300' :
                          candidato.estado === 'en_revision' ? 'bg-blue-950 text-blue-300' :
                          candidato.estado === 'rechazado' ? 'bg-red-950 text-red-300' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {candidato.estado}
                        </span>
                        <Button variant="outline" size="sm">Ver Perfil</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* EVALUACIONES TAB */}
        {activeTab === 'evaluaciones' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Historial de Evaluaciones</h2>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6">
                <p className="text-zinc-400 text-center py-8">
                  📊 Las evaluaciones de WhatsApp aparecerán aquí cuando los candidatos completen la pre-entrevista
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
