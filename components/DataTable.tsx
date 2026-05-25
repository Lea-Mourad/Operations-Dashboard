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
      <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[#fafafa] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
        {empty ?? "No data available."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-[#f9fafb]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`border-b border-[var(--border)] px-[18px] py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="transition hover:bg-[#fafafa]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`border-b border-[var(--border)] px-[18px] py-[11px] align-top text-sm text-[var(--text-secondary)] last:border-b-0 ${column.className ?? ""}`}
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
