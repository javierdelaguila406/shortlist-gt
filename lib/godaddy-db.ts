/**
 * Godaddy MySQL Connection
 * Sincroniza datos con servidor Godaddy
 */

import mysql from 'mysql2/promise';

const godaddyConfig = {
  host: process.env.GODADDY_MYSQL_HOST || '160.153.173.151',
  user: process.env.GODADDY_MYSQL_USER || 'furnitureicity_user_furniture',
  password: process.env.GODADDY_MYSQL_PASSWORD || '',
  database: process.env.GODADDY_MYSQL_DATABASE || 'furnitureicity_wp_furniture',
  port: parseInt(process.env.GODADDY_MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;

export async function getGodaddyPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool(godaddyConfig);
  }
  return pool;
}

export async function getGodaddyConnection() {
  const pool = await getGodaddyPool();
  return pool.getConnection();
}

/**
 * Crear tablas en Godaddy si no existen
 */
export async function initializeGodaddyDatabase() {
  try {
    const connection = await getGodaddyConnection();

    // Tabla de empresas/usuarios
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) UNIQUE,
        email VARCHAR(255),
        nombre VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'demo',
        license_code_used VARCHAR(255),
        plan_upgraded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabla de vacantes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vacantes (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        titulo VARCHAR(255),
        descripcion LONGTEXT,
        departamento VARCHAR(255),
        estado VARCHAR(50) DEFAULT 'abierta',
        link_aplicar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (estado)
      )
    `);

    // Tabla de candidatos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS candidatos (
        id VARCHAR(36) PRIMARY KEY,
        vacante_id VARCHAR(36),
        nombre VARCHAR(255),
        email VARCHAR(255),
        telefono VARCHAR(20),
        cv_url VARCHAR(500),
        estado VARCHAR(50) DEFAULT 'pendiente',
        score_ia INT,
        experiencia_anos INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (vacante_id),
        INDEX (email),
        INDEX (estado)
      )
    `);

    // Tabla de evaluaciones WhatsApp
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS evaluaciones_whatsapp (
        id VARCHAR(36) PRIMARY KEY,
        candidato_id VARCHAR(36),
        vacante_id VARCHAR(36),
        paso INT,
        estado VARCHAR(50),
        mensaje_confirmacion_enviado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (candidato_id),
        INDEX (vacante_id)
      )
    `);

    await connection.end();
    console.log('[GODADDY] Database initialized successfully');
    return true;
  } catch (error) {
    console.error('[GODADDY] Error initializing database:', error);
    return false;
  }
}

/**
 * Insertar registro en Godaddy
 */
export async function insertGodaddyRecord(
  table: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const connection = await getGodaddyConnection();

    const columns = Object.keys(data).join(',');
    const values = Object.values(data).map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${values})`;

    await connection.execute(sql, Object.values(data));
    await connection.end();

    console.log(`[GODADDY] Inserted into ${table}:`, data.id || data.email);
    return true;
  } catch (error) {
    console.error(`[GODADDY] Error inserting into ${table}:`, error);
    return false;
  }
}

/**
 * Actualizar registro en Godaddy
 */
export async function updateGodaddyRecord(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const connection = await getGodaddyConnection();

    const setClause = Object.keys(data).map(key => `${key} = ?`).join(',');
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;

    await connection.execute(sql, [...Object.values(data), id]);
    await connection.end();

    console.log(`[GODADDY] Updated ${table}:`, id);
    return true;
  } catch (error) {
    console.error(`[GODADDY] Error updating ${table}:`, error);
    return false;
  }
}

/**
 * Obtener registro de Godaddy
 */
export async function getGodaddyRecord(
  table: string,
  id: string
): Promise<any | null> {
  try {
    const connection = await getGodaddyConnection();

    const [rows] = await connection.execute(
      `SELECT * FROM ${table} WHERE id = ?`,
      [id]
    );

    await connection.end();

    return (rows as any[])[0] || null;
  } catch (error) {
    console.error(`[GODADDY] Error getting record from ${table}:`, error);
    return null;
  }
}
