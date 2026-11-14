import { TipoDiabetes } from '../enums/tipo-diabetes.enum';
import { isPerfilCompleto } from './perfil-completo';

describe('isPerfilCompleto', () => {
  const completo = {
    dataNascimento: '1995-04-12',
    tipoDiabetes: TipoDiabetes.TIPO_1,
    alturaCm: 170,
    pesoKg: 68,
  };

  it('com os quatro campos preenchidos: completo', () => {
    expect(isPerfilCompleto(completo)).toBe(true);
  });

  it.each(['dataNascimento', 'tipoDiabetes', 'alturaCm', 'pesoKg'] as const)(
    'sem %s: incompleto',
    (campo) => {
      expect(isPerfilCompleto({ ...completo, [campo]: null })).toBe(false);
    },
  );

  it('sem perfil (dado legado): incompleto', () => {
    expect(isPerfilCompleto(null)).toBe(false);
    expect(isPerfilCompleto(undefined)).toBe(false);
  });
});
