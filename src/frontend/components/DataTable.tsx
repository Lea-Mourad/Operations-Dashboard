import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[12px] border-[0.5px] border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-12 text-center text-[12px] font-medium text-[var(--text-secondary)]">
        {empty ?? "No data available."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
      <table className="min-w-full border-collapse">
        <thead className="bg-[var(--surface-muted)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`border-b-[0.5px] border-[var(--border)] px-[18px] py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="transition hover:bg-[var(--surface-muted)]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`border-b-[0.5px] border-[var(--border)] px-[18px] py-[11px] align-top text-[12px] font-medium leading-5 text-[var(--text-secondary)] last:border-b-0 ${column.className ?? ""}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
