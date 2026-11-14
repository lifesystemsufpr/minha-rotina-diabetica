export function validRegisterPayload(overrides: Record<string, unknown> = {}) {
  return {
    nome: 'Maria Silva',
    email: 'maria@example.com',
    senha: 'senha-forte-123',
    dataNascimento: '1995-04-12',
    tipoDiabetes: 'TIPO_1',
    alturaCm: 170.5,
    pesoKg: 68.3,
    ...overrides,
  };
}
