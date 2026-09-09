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
  '/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si es ruta protegida
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  // Si es ruta protegida, verificar autenticación
  if (isProtectedRoute) {
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

  return NextResponse.next();
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
