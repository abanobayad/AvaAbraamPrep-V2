/**
 * Quote a CSV cell and neutralize spreadsheet formula injection:
 * Excel and Sheets treat cells starting with = + - @ (or tab/CR) as formulas.
 */
export function csvCell(value: string | null | undefined): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return `"${v.replace(/"/g, '""')}"`;
}
