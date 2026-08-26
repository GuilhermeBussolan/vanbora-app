/** Monta o HTML simples usado pelo expo-print para gerar o PDF do relatório financeiro. */
import { FinanceReport, ReportLine } from '@/api/finance';
import { formatCurrency } from '@/data/mockData';

function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function renderRows(lines: ReportLine[]): string {
  if (lines.length === 0) {
    return '<tr><td colspan="3" class="empty">Nenhum lançamento no período.</td></tr>';
  }
  return lines
    .map(
      (l) => `<tr>
        <td>${formatFullDate(l.date)}</td>
        <td>${escapeHtml(l.description)}</td>
        <td class="amount">${escapeHtml(formatCurrency(l.amount))}</td>
      </tr>`,
    )
    .join('');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildFinanceReportHtml(report: FinanceReport): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A1A1A; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 2px; }
  .period { font-size: 13px; color: #666; margin-bottom: 20px; }
  .summary { display: flex; gap: 12px; margin-bottom: 24px; }
  .card { flex: 1; border: 1px solid #E5E5E5; border-radius: 8px; padding: 12px; }
  .card .label { font-size: 11px; color: #777; text-transform: uppercase; letter-spacing: .3px; }
  .card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #E5E5E5; color: #777; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #F0F0F0; }
  td.amount, th.amount { text-align: right; }
  .empty { text-align: center; color: #999; padding: 12px; }
</style>
</head>
<body>
  <h1>Relatório financeiro — ${escapeHtml(report.transporterName)}</h1>
  <div class="period">${formatFullDate(report.from)} a ${formatFullDate(report.to)} · ${report.km} km rodados</div>

  <div class="summary">
    <div class="card"><div class="label">Recebido</div><div class="value">${escapeHtml(formatCurrency(report.totalReceived))}</div></div>
    <div class="card"><div class="label">Despesas</div><div class="value">${escapeHtml(formatCurrency(report.totalExpenses))}</div></div>
    <div class="card"><div class="label">Resultado</div><div class="value">${escapeHtml(formatCurrency(report.balance))}</div></div>
  </div>

  <h2>Receitas</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th class="amount">Valor</th></tr></thead>
    <tbody>${renderRows(report.income)}</tbody>
  </table>

  <h2>Despesas</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th class="amount">Valor</th></tr></thead>
    <tbody>${renderRows(report.expenses)}</tbody>
  </table>
</body>
</html>`;
}
