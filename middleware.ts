import { NextRequest, NextResponse } from 'next/server';

// Rutas protegidas que requieren autenticación
const protectedRoutes = [
  '/dashboard/reclutador',
  '/dashboard/postulantes',
  '/api/candidatos/eliminar',
  '/api/candidatos/exportar',
  '/api/vacantes',
];

// Rutas públicas
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/confirm',
  '/dashboard/demo',
  '/acceso',
  '/vacantes/crear',
  '/postular',
  '/api/vacantes/crear',
  '/api/vacantes/buscar',
  '/api/candidatos/postular',
  '/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Crear respuesta base
  const response = NextResponse.next();

  // ========== SEGURIDAD: CORS ==========
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://shortlist-gt.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // ========== SEGURIDAD: Security Headers ==========
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // ========== SEGURIDAD: Content Security Policy ==========
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' fonts.gstatic.com; connect-src 'self' https://xropotkrcovaqsarkjvp.supabase.co wss://xropotkrcovaqsarkjvp.supabase.co"
  );

  // Verificar si es ruta pública PRIMERO (tiene prioridad)
  // Exactitud para rutas raíz
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Exactitud para rutas con prefijos
  const isPublicAPI = publicRoutes.some(route => {
    if (route.includes('/api/')) {
      return pathname.startsWith(route);
    }
    return false;
  });

  if (isPublicRoute || isPublicAPI) {
    return response;
  }

  // Verificar si es ruta protegida
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Si es ruta protegida, verificar autenticación
  if (isProtectedRoute) {
    if (pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('Authorization');

      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', success: false },
          { status: 401 }
        );
      }

      return response;
    }

    const token = request.cookies.get('sb-auth-token')?.value;

    if (!token) {
      // Redirigir a login si no hay token
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Validar que el token sea válido (formato básico)
    if (!isValidToken(token)) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}

function isValidToken(token: string): boolean {
  try {
    // Token debe ser un JWT o sesión válida
    // Por ahora, verificar que no esté vacío
    return !!token && token.length > 10;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
