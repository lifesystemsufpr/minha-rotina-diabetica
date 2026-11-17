import { isIP } from 'node:net';

export function configurarTrustProxy(
  valor?: string,
): number | string[] | undefined {
  const entrada = valor?.trim();
  if (!entrada) return undefined;
  if (/^(?:[1-9]|10)$/.test(entrada)) return Number(entrada);

  const redes = entrada.split(',').map((rede) => rede.trim());
  const valida = redes.every((rede) => {
    if (['loopback', 'linklocal', 'uniquelocal'].includes(rede)) return true;
    const partes = rede.split('/');
    if (partes.length > 2) return false;
    const versao = isIP(partes[0]);
    if (!versao) return false;
    if (partes.length === 1) return true;
    const prefixo = partes[1];
    // Prefixo 0 cobre todos os endereços: seria confiar em qualquer cliente.
    return (
      /^[1-9]\d*$/.test(prefixo) && Number(prefixo) <= (versao === 4 ? 32 : 128)
    );
  });
  if (!valida) {
    throw new Error(
      'TRUST_PROXY inválido: use um inteiro de 1 a 10 ou uma lista de IPs, faixas CIDR (prefixo a partir de 1) e nomes loopback, linklocal ou uniquelocal.',
    );
  }
  return redes;
}
