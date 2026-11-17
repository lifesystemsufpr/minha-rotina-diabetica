import { configurarTrustProxy } from './trust-proxy';

describe('configurarTrustProxy', () => {
  it.each([undefined, '', '  '])('mantém o padrão para %s', (valor) => {
    expect(configurarTrustProxy(valor)).toBeUndefined();
  });

  it.each(['1', '10', ' 2 '])('aceita quantidade de proxies %s', (valor) => {
    expect(configurarTrustProxy(valor)).toBe(Number(valor));
  });

  it('aceita endereços, faixas e nomes conhecidos', () => {
    expect(
      configurarTrustProxy(
        ' 192.0.2.1, 10.0.0.0/8, ::1, 2001:db8::/32, loopback, linklocal, uniquelocal ',
      ),
    ).toEqual([
      '192.0.2.1',
      '10.0.0.0/8',
      '::1',
      '2001:db8::/32',
      'loopback',
      'linklocal',
      'uniquelocal',
    ]);
  });

  it.each([
    'true',
    '*',
    '0',
    '11',
    '-1',
    '1.5',
    '01',
    'localhost',
    '10.0.0.1/33',
    '::1/129',
    '10.0.0.1/',
    '10.0.0.1,,::1',
    '10.0.0.1/08',
    '0.0.0.0/0',
    '::/0',
  ])('recusa %s', (valor) => {
    expect(() => configurarTrustProxy(valor)).toThrow(
      /TRUST_PROXY.*inteiro.*1.*10/,
    );
  });
});
