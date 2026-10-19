import { And, FindOperator, LessThan, MoreThanOrEqual } from 'typeorm';

// 'AAAA-MM-DD' -> meia-noite local daquele dia (sem passar por UTC).
function startOfDay(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Condição do TypeORM para filtrar uma coluna de data/hora pelo período
// [startDate 00:00, endDate + 1 dia 00:00). Sem datas, não filtra.
export function dateRangeWhere(
  startDate?: string,
  endDate?: string,
): FindOperator<Date> | undefined {
  const from = startDate ? MoreThanOrEqual(startOfDay(startDate)) : undefined;
  let to: FindOperator<Date> | undefined;
  if (endDate) {
    const nextDay = startOfDay(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    to = LessThan(nextDay);
  }
  if (from && to) return And(from, to);
  return from ?? to;
}
