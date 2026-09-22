import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { SignJWT } from 'jose';

/**
 * POST /api/admin/generate-token
 * Generates a temporary admin JWT token valid for 1 hour
 * Requires ADMIN_SECRET_TOKEN for authentication (can be rotated without redeployment)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminSecret = process.env.ADMIN_SECRET_TOKEN;

    // Verify admin secret using timing-safe comparison
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length);

    if (!adminSecret) {
      console.error('[SECURITY] ADMIN_SECRET_TOKEN not configured');
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }

    // Timing-safe token comparison
    let isValid = false;
    try {
      isValid = timingSafeEqual(
        new Uint8Array(Buffer.from(token)),
        new Uint8Array(Buffer.from(adminSecret))
      );
    } catch {
      isValid = false;
    }

    if (!isValid) {
      console.warn('[SECURITY] Invalid admin token attempt', {
        ipAddress: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin credentials' },
        { status: 403 }
      );
    }

    // Generate JWT token valid for 1 hour
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('[SECURITY] SUPABASE_JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'JWT secret not configured' },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600; // 1 hour expiration

    const adminToken = await new SignJWT({
      sub: 'admin',
      role: 'admin',
      iat: now,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresAt)
      .sign(secret);

    console.log('[ADMIN] Generated temporary admin token', {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      ipAddress: request.headers.get('x-forwarded-for'),
    });

    return NextResponse.json({
      success: true,
      token: adminToken,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('[ADMIN] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate admin token' },
      { status: 500 }
    );
  }
}
