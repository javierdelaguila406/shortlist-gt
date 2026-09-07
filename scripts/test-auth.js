#!/usr/bin/env node

/**
 * Script de prueba exhaustivo para autenticación
 * Prueba todos los flujos, validaciones y casos de error
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.status,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            cookies: res.headers['set-cookie'] || [],
          });
        } catch (e) {
          resolve({
            status: res.status,
            headers: res.headers,
            body: data,
            cookies: res.headers['set-cookie'] || [],
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const tests = [
  {
    name: '❌ Login con email inválido',
    request: () => makeRequest('POST', '/api/auth/signin', {
      email: 'invalid-email',
      password: 'Password123',
    }),
    expect: { status: 400 },
  },
  {
    name: '❌ Login con contraseña muy corta',
    request: () => makeRequest('POST', '/api/auth/signin', {
      email: 'test@example.com',
      password: 'short',
    }),
    expect: { status: 400 },
  },
  {
    name: '❌ Login con email inexistente',
    request: () => makeRequest('POST', '/api/auth/signin', {
      email: 'nonexistent@example.com',
      password: 'Password123',
    }),
    expect: { status: 401 },
  },
  {
    name: '✅ Login con credenciales correctas',
    request: () => makeRequest('POST', '/api/auth/signin', {
      email: 'reclutador@demo.com',
      password: 'demo123',
    }),
    expect: { status: 200, hasCookie: true },
  },
  {
    name: '❌ Signup con contraseña sin mayúscula',
    request: () => makeRequest('POST', '/api/auth/signup', {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    }),
    expect: { status: 400 },
  },
  {
    name: '❌ Signup con contraseña sin número',
    request: () => makeRequest('POST', '/api/auth/signup', {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'PasswordNoNumber',
      confirmPassword: 'PasswordNoNumber',
    }),
    expect: { status: 400 },
  },
  {
    name: '❌ Signup con contraseñas que no coinciden',
    request: () => makeRequest('POST', '/api/auth/signup', {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'DifferentPassword123',
    }),
    expect: { status: 400 },
  },
];

async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DE AUTENTICACIÓN\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Test: ${test.name}`);
      const result = await test.request();

      let success = result.status === test.expect.status;
      if (test.expect.hasCookie && success) {
        success = result.cookies.length > 0;
      }

      if (success) {
        console.log(`  ✅ PASS - Status: ${result.status}`);
        if (result.cookies.length > 0) {
          console.log(`  🍪 Cookie establecida: ${result.cookies[0].split(';')[0]}`);
        }
        passed++;
      } else {
        console.log(`  ❌ FAIL - Esperaba ${test.expect.status}, obtuvo ${result.status}`);
        console.log(`  Respuesta: ${JSON.stringify(result.body)}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR - ${error.message}`);
      failed++;
    }

    console.log();
  }

  console.log('='.repeat(60));
  console.log(`\n📊 RESULTADOS:`);
  console.log(`  ✅ Pasadas: ${passed}`);
  console.log(`  ❌ Fallidas: ${failed}`);
  console.log(`  📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  } else {
    console.log(`\n⚠️  ${failed} pruebas fallaron`);
  }
}

console.log('💡 Asegúrate de que el dev server está corriendo: npm run dev\n');
setTimeout(runTests, 1000);
