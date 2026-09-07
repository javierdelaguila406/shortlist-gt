import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Email inválido').toLowerCase();

// Teléfono con formato internacional (+502XXXXXXXX)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono debe tener formato internacional (+502XXXXXXXX)')
  .transform(v => v.startsWith('+') ? v : `+${v}`);

// Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 número
export const passwordSchema = z
  .string()
  .min(8, 'Contraseña debe tener mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Contraseña debe tener al menos 1 mayúscula')
  .regex(/[0-9]/, 'Contraseña debe tener al menos 1 número');

// Postulación de candidato
export const candidatoPostulacionSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido').max(100),
  email: emailSchema,
  telefono: phoneSchema,
  disponibilidad: z.string().optional(),
  salario: z.string().optional(),
  slug: z.string().min(1, 'Plaza requerida'),
});

// Validación de archivo PDF
export const pdfFileSchema = z.instanceof(File)
  .refine(file => file.type === 'application/pdf', 'Solo se permiten archivos PDF')
  .refine(file => file.size <= 5 * 1024 * 1024, 'Archivo no debe exceder 5MB');

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

// Signup
export const signupSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido').max(100),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// CV Analysis
export const cvAnalysisSchema = z.object({
  cvText: z.string().optional(),
  jobDescription: z.string().min(10, 'Descripción de plaza requerida'),
  candidatoId: z.string().optional(),
  cvPath: z.string().optional(),
}).refine(data => data.cvText || data.cvPath, {
  message: 'CV text o CV path requerido',
});
