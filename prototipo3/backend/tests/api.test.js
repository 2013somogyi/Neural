const assert = require('assert');
const app = require('../src/server');

async function runTests() {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`Testing backend API on port ${port}...`);

  try {
    // 1. Healthcheck & Security Headers
    let res = await fetch(`${baseUrl}/health`);
    let data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    console.log('✔ Healthcheck & Security Headers passed');

    // 2. Unauthorized request test
    res = await fetch(`${baseUrl}/clientes`);
    assert.strictEqual(res.status, 401);
    console.log('✔ Unauthorized request rejected correctly');

    // 3. Auth Login
    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', senha: '123456' })
    });
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
    const token = data.token;
    console.log('✔ Login passed');

    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 4. GET Clientes
    res = await fetch(`${baseUrl}/clientes`, { headers: authHeader });
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 2);
    console.log('✔ GET Clientes passed');

    // 5. POST Clientes
    res = await fetch(`${baseUrl}/clientes`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        nome_completo: 'Test Customer',
        cpf_cnpj: '000.111.222-33',
        telefone: '11999990000',
        email: 'test@customer.com'
      })
    });
    data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.nome_completo, 'Test Customer');
    const newClientId = data.id_cliente;
    console.log('✔ POST Clientes passed');

    // 6. POST OS
    res = await fetch(`${baseUrl}/os`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        id_cliente: newClientId,
        equipamento_tipo: 'Notebook',
        marca: 'Dell',
        modelo: 'XPS 13',
        relato_problema: 'Bateria viciada'
      })
    });
    data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.numero_os, 68);
    console.log('✔ POST OS with auto-number passed');

    // 7. GET Dashboard
    res = await fetch(`${baseUrl}/dashboard`, { headers: authHeader });
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.faturamentoTotal !== undefined);
    assert.ok(data.qtdOS >= 2);
    console.log('✔ GET Dashboard passed');

    console.log('\n✅ ALL BACKEND SECURITY & API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ API Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
