import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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
  // Cross-Origin Resource Sharing configuration
  // Development: allows localhost for frontend development
  // Production: restricts to deployed domain only to prevent unauthorized cross-origin access
  // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  const origin = request.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowedOrigins = isDevelopment
    ? [
        'https://shortlist-gt.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
    : [
        'https://shortlist-gt.vercel.app'  // Production: only allow deployed domain
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
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // ========== SEGURIDAD: Content Security Policy ==========
  const isDev = process.env.NODE_ENV === 'development';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.co';

  const cspPolicy = isDev
    ? // Desarrollo: permite inline scripts para Next.js HMR
      `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdnjs.cloudflare.com cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' fonts.gstatic.com; connect-src 'self' ${supabaseUrl} wss://${supabaseUrl.replace('https://', '')}; frame-ancestors 'none'; base-uri 'self'`
    : // Producción: restrictivo (sin unsafe-inline/unsafe-eval)
      `default-src 'self'; script-src 'self' cdnjs.cloudflare.com cdn.jsdelivr.net; style-src 'self' fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' fonts.gstatic.com; connect-src 'self' ${supabaseUrl} wss://${supabaseUrl.replace('https://', '')}; frame-ancestors 'none'; base-uri 'self'`;

  response.headers.set('Content-Security-Policy', cspPolicy);

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
          { error: 'Unauthorized: Missing Bearer token', success: false },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix
      // IMPORTANT: Full JWT verification with signature happens in API endpoints
      // This middleware only does basic format validation for performance
      const isValid = isValidJWTFormat(token);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid token format', success: false },
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

    // IMPORTANT: Only basic format validation here
    // MUST verify signature in API endpoints using Supabase.auth.getUser()
    const isValid = isValidJWTFormat(token);
    if (!isValid) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}

/**
 * Validates JWT format, expiration, AND cryptographic signature
 * Uses Supabase JWT_SECRET to verify token authenticity
 * Prevents forged token attacks
 */
async function isValidJWT(token: string): Promise<boolean> {
  try {
    if (!token || token.length < 50) {
      return false;
    }

    // Check JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Validate header
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      if (!header.alg || !header.typ) {
        return false;
      }
    } catch {
      return false;
    }

    // Validate payload and check expiration
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Check required claims
      if (!payload.sub) {
        return false;
      }

      // Check if token is expired
      if (payload.exp) {
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        if (Date.now() > expirationTime) {
          return false;
        }
      } else {
        // No expiration claim is invalid
        return false;
      }
    } catch {
      return false;
    }

    // Verify JWT signature using Supabase JWT secret (REQUIRED - fail securely if missing)
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('[SECURITY] SUPABASE_JWT_SECRET environment variable is required for JWT signature verification. Cannot authenticate without it. Check your .env configuration.');
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      await jwtVerify(token, secret);
      return true;
    } catch (signatureError) {
      console.warn('[SECURITY] JWT signature verification failed:', signatureError instanceof Error ? signatureError.message : 'Unknown error');
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Synchronous wrapper for JWT validation (format only, for middleware performance)
 * Note: Full signature verification happens in API endpoints via Supabase.auth.getUser()
 */
function isValidJWTFormat(token: string): boolean {
  try {
    if (!token || token.length < 50) {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (!header.alg || !header.typ) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload.sub) {
      return false;
    }

    if (payload.exp) {
      const expirationTime = payload.exp * 1000;
      if (Date.now() > expirationTime) {
        return false;
      }
    } else {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
