/**
 * Security Utilities para SHORTLIST.GT
 * - XSS Protection
 * - Input Validation
 * - Encryption for Sensitive Data
 * - Audit Logging
 */

import crypto from 'crypto';

// ========== XSS PROTECTION ==========
/**
 * Sanitizar texto para prevenir XSS
 * Remueve scripts y HTML peligroso
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+\s*=/gi, '') // Remover event handlers
    .trim();
}

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar teléfono (formato básico)
 */
export function validatePhone(phone: string): boolean {
  // Aceptar teléfonos con al menos 7 dígitos
  const phoneRegex = /\d{7,}/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// ========== ENCRYPTION FOR SENSITIVE DATA ==========
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encriptar datos sensibles (teléfono, email)
 * Para producción, usar un key manager seguro
 */
export function encryptSensitiveData(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[ENCRYPTION] Error:', error);
    return data; // Fallback a texto plano (NO ideal)
  }
}

/**
 * Desencriptar datos sensibles
 */
export function decryptSensitiveData(encrypted: string): string {
  try {
    const [ivHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
      iv
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[DECRYPTION] Error:', error);
    return encrypted; // Fallback
  }
}

// ========== AUDIT LOGGING ==========
interface AuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  resourceType: string;
  resourceId: string;
  status: 'success' | 'failure';
  details?: any;
  ipAddress?: string;
}

/**
 * Registrar acciones críticas para auditoría
 * En producción, guardar en base de datos o servicio de logging
 */
export function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId: string,
  status: 'success' | 'failure',
  details?: any,
  userId?: string,
  ipAddress?: string
): void {
  const log: AuditLog = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    resourceType,
    resourceId,
    status,
    details,
    ipAddress,
  };

  console.log('[AUDIT]', JSON.stringify(log));

  // En producción, enviar a servicio de logging (Sentry, LogRocket, etc)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Enviar a servicio de logging
    // await sendToLoggingService(log);
  }
}

// ========== SQL INJECTION PREVENTION ==========
/**
 * Validar que un valor no contenga inyección SQL
 * Nota: Supabase con prepared statements es seguro, pero validar entrada
 */
export function validateAgainstSQLInjection(input: string): boolean {
  const sqlKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
    'UNION', 'SELECT', 'EXEC', 'SCRIPT'
  ];

  const upperInput = input.toUpperCase();
  return !sqlKeywords.some(keyword => upperInput.includes(keyword));
}

// ========== REQUEST VALIDATION ==========
/**
 * Validar request ID para prevenir enumeración
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validar ID de vacante
 */
export function isValidVacanteId(id: string): boolean {
  // Aceptar formato: vacante-TIMESTAMP o UUID
  return /^vacante-\d+$/.test(id) || isValidUUID(id);
}

// ========== SECURE RANDOM GENERATION ==========
/**
 * Generar token seguro para 2FA, password reset, etc
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// ========== RATE LIMIT HEADERS ==========
/**
 * Generar headers para rate limiting en respuesta
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  };
}
