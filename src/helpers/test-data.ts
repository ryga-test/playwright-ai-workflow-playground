export type RelativeDateFormat = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatRelativeDate(offsetDays: number, format: RelativeDateFormat): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = String(date.getFullYear());

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
  }
}

export function syntheticEmail(flowId: string, domain: string): string {
  const safeFlowId = flowId.replace(/[^a-z0-9-]/g, '-');
  const runId = process.env.PLAYWRIGHT_RUN_ID?.replace(/[^a-zA-Z0-9-]/g, '-') ?? 'local-run';
  return `${safeFlowId}-${runId}@${domain}`;
}
