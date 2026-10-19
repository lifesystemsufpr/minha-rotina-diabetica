// Idade em anos completos a partir de 'AAAA-MM-DD'. Não usa new Date(texto):
// 'AAAA-MM-DD' é lido como meia-noite em UTC e, no fuso do Brasil, vira o dia
// anterior, mudando a idade um dia antes do aniversário.
export function calcularIdade(
  dataNascimento: string | null | undefined,
  hoje: Date = new Date(),
): number | null {
  if (!dataNascimento) return null;
  const [ano, mes, dia] = dataNascimento.slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return null;

  let idade = hoje.getFullYear() - ano;
  const mesAtual = hoje.getMonth() + 1;
  const aindaNaoFezAniversarioEsteAno =
    mesAtual < mes || (mesAtual === mes && hoje.getDate() < dia);
  if (aindaNaoFezAniversarioEsteAno) idade--;
  return idade;
}
