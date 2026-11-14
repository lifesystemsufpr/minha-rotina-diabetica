import { Perfil } from '../entities/perfil.entity';

type CamposDoPerfil = Pick<
  Perfil,
  'dataNascimento' | 'tipoDiabetes' | 'alturaCm' | 'pesoKg'
>;

// Regra única de "perfil completo": os quatro dados de saúde preenchidos.
// Sem perfil (dado legado) conta como incompleto.
export function isPerfilCompleto(
  perfil: CamposDoPerfil | null | undefined,
): boolean {
  if (!perfil) return false;
  return (
    perfil.dataNascimento != null &&
    perfil.tipoDiabetes != null &&
    perfil.alturaCm != null &&
    perfil.pesoKg != null
  );
}
