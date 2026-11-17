import { randomBytes } from 'node:crypto';

const argumento = process.argv[2];
if (!argumento) {
  console.error('Uso: node scripts/conferencia-pos-deploy.mjs https://api.exemplo.com');
  process.exit(1);
}

let base;
try {
  const url = new URL(argumento);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error();
  base = url.origin;
} catch {
  console.error('FALHOU: informe a URL base da API, sem caminho, credenciais ou parâmetros.');
  process.exit(1);
}

const email = `conferencia+${Date.now()}${randomBytes(4).readUInt32BE()}@exemplo.invalid`;
const senha = `Teste1${randomBytes(18).toString('hex')}`;
// Atualize junto com VERSAO_ATUAL_TERMOS em src/modules/auth/terms-policy.ts.
const versaoTermos = '2026-11-16';
let token;
let cadastroPossivel = false;
let falhou = false;
let etapa = 'Cadastro';

async function requisicao(metodo, caminho, corpo, autorizado = false) {
  let resposta;
  try {
    resposta = await fetch(`${base}/api${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        ...(autorizado ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(corpo ? { body: JSON.stringify(corpo) } : {}),
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    });
  } catch {
    throw new Error('não foi possível concluir a requisição');
  }
  return resposta;
}

async function verificar(resposta, esperado) {
  if (resposta.status !== esperado) throw new Error(`HTTP ${resposta.status}; esperado ${esperado}`);
  if (esperado === 204 || esperado === 401) return;
  try { return await resposta.json(); } catch { throw new Error('resposta não contém JSON válido'); }
}

async function executar(nome, acao) {
  etapa = nome;
  const resultado = await acao();
  console.log(`${nome}: ok`);
  return resultado;
}

async function entrar() {
  const dados = await verificar(await requisicao('POST', '/auth/login', { email, senha }), 200);
  if (typeof dados?.accessToken !== 'string' || !dados.accessToken) throw new Error('token ausente');
  return dados.accessToken;
}

try {
  await executar('Cadastro', async () => {
    cadastroPossivel = true;
    const resposta = await requisicao('POST', '/auth/register', { nome: 'Conta de Conferência', email, senha, versaoTermos });
    if (resposta.status === 409) cadastroPossivel = false;
    await verificar(resposta, 201);
  });
  token = await executar('Login', entrar);
  await executar('Perfil', async () => {
    await verificar(await requisicao('PATCH', '/profile', { dataNascimento: '1995-04-12', tipoDiabetes: 'TIPO_1', alturaCm: 170, pesoKg: 68 }, true), 200);
  });
  await executar('Glicemia baixa', async () => {
    const dados = await verificar(await requisicao('POST', '/glycemias', { valor: 50, momento: 'JEJUM', dataHora: new Date(Date.now() - 2000).toISOString() }, true), 201);
    if (dados?.status !== 'BAIXA' || dados.hipoglicemiaNivel2 !== true) throw new Error('classificação ou hipoglicemia nível 2 incorreta');
  });
  const ultima = await executar('Glicemia alta', async () => {
    const dados = await verificar(await requisicao('POST', '/glycemias', { valor: 150, momento: 'JEJUM', dataHora: new Date(Date.now() - 1000).toISOString() }, true), 201);
    if (dados?.status !== 'ALTA' || !dados.id) throw new Error('classificação ou ID incorreto');
    return dados;
  });
  await executar('Insulina', async () => {
    const dados = await verificar(await requisicao('POST', '/insulin-applications', { tipo: 'ULTRARRAPIDA', doseUi: 1, localAplicacao: 'ABDOMEN', dataHora: new Date().toISOString() }, true), 201);
    if (dados?.tipo !== 'ULTRARRAPIDA') throw new Error('tipo de insulina incorreto');
  });
  await executar('Resumo da Home', async () => {
    const dados = await verificar(await requisicao('GET', '/home/summary', undefined, true), 200);
    if (dados?.ultimaGlicemia?.id !== ultima.id) throw new Error('última glicemia não encontrada');
  });
} catch (erro) {
  falhou = true;
  console.error(`${etapa}: FALHOU: ${erro.message}`);
} finally {
  if (cadastroPossivel) {
    try {
      etapa = 'Exclusão da conta';
      if (!token) token = await entrar();
      await verificar(await requisicao('DELETE', '/users/me', undefined, true), 204);
      cadastroPossivel = false;
      console.log('Exclusão da conta: ok');
      await executar('Login após exclusão', async () => {
        await verificar(await requisicao('POST', '/auth/login', { email, senha }), 401);
      });
    } catch (erro) {
      falhou = true;
      console.error(`${etapa}: FALHOU: ${erro.message}`);
      if (cadastroPossivel) console.error(`Limpeza pendente: se a conta ${email} chegou a ser criada, ela ficou no banco. Exclua essa conta à mão.`);
    }
  }
}
if (falhou) process.exitCode = 1;
