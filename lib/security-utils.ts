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
    // Remove HTML tags and dangerous characters
    .replace(/[<>]/g, '')
    // Remove event handlers (onclick, onload, etc)
    .replace(/on\w+\s*=[\s\S]*?(?=\s|>|$)/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (data URIs can be dangerous)
    .replace(/data:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Escape quotes to prevent breakout
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validar email con RFC 5322 simplified check
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }

  // More strict email regex
  // Format: local-part@domain
  // Local part: alphanumeric, dots, hyphens, underscores
  // Domain: alphanumeric, dots, hyphens with at least one TLD
  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  const parts = email.split('@');
  if (parts[0].length === 0 || parts[0].length > 64) {
    return false; // Local part must be 1-64 chars
  }

  // No consecutive dots
  if (email.includes('..')) {
    return false;
  }

  // Cannot start/end with dot
  if (email.startsWith('.') || email.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Validar teléfono (formato internacional)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.length < 7 || phone.length > 20) {
    return false;
  }

  // Acepta formato internacional: +XXX-XXX-XXXX o similar
  // Acepta solo dígitos y caracteres permitidos (+, -, espacio, paréntesis)
  const phoneRegex = /^[\d\s+\-()]+$/;

  if (!phoneRegex.test(phone)) {
    return false;
  }

  // Debe tener al menos 7 dígitos
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  return true;
}

// ========== ENCRYPTION FOR SENSITIVE DATA ==========
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. This is required for production.');
  }
  // Key must be exactly 32 bytes for AES-256
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long (256 bits)');
  }
  return Buffer.from(key.slice(0, 32));
}

/**
 * Encriptar datos sensibles (teléfono, email)
 * IMPORTANTE: No fallback a texto plano - la encriptación es obligatoria
 */
export function encryptSensitiveData(data: string): string {
  if (!data) {
    throw new Error('Cannot encrypt empty data');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[ENCRYPTION] Critical error:', error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Desencriptar datos sensibles
 * IMPORTANTE: Lanza error si falla - no retorna texto plano
 */
export function decryptSensitiveData(encrypted: string): string {
  if (!encrypted || !encrypted.includes(':')) {
    throw new Error('Invalid encrypted data format');
  }

  try {
    const [ivHex, encryptedData] = encrypted.split(':');

    if (!ivHex || !encryptedData) {
      throw new Error('Malformed encrypted data');
    }

    const iv = Buffer.from(ivHex, 'hex');
    if (iv.length !== 16) {
      throw new Error('Invalid IV length');
    }

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[DECRYPTION] Critical error:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * IMPORTANTE: Supabase usa prepared statements, pero aún validamos entrada
 */
export function validateAgainstSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const upperInput = input.toUpperCase();

  // Dangerous SQL keywords and patterns
  const dangerousPatterns = [
    // DDL (Data Definition Language)
    /\bDROP\b/,
    /\bCREATE\b/,
    /\bALTER\b/,
    /\bTRUNCATE\b/,

    // DML (Data Manipulation Language) - risky in certain contexts
    /\bDELETE\b/,
    /\bINSERT\b/,
    /\bUPDATE\b/,

    // Query control
    /\bUNION\b/,
    /\bSELECT\b/,
    /\bEXEC\b/,
    /\bEXECUTE\b/,

    // Advanced injection
    /\bPRAGMA\b/,
    /\bATTACH\b/,
    /\bDETACH\b/,
    /\bREPLACE\b/,

    // Script injection via SQL comments
    /--/,
    /\/\*/,
    /\*\//,
    /;.*\n/,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(upperInput));
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
