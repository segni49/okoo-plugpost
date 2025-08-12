"use client"



type Column<T> = {
  key: keyof T | string
  header: React.ReactNode
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T, index: number) => string
  emptyMessage?: string
}

export function DataTable<T>({ columns, data, getRowKey, emptyMessage = "No data" }: DataTableProps<T>) {


  if (!data.length) {
    return (
      <div className="bg-white rounded-md border p-8 text-center text-gray-500">{emptyMessage}</div>
    )
  }

  return (
    <div className="bg-white rounded-md border overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-6 py-4 text-sm text-gray-700 ${col.className ?? ""}`}>
                  {col.render ? col.render(row) : (() => {
                    const key = col.key as keyof T
                    const value = (row as T)[key]
                    return typeof value === "string" || typeof value === "number" ? String(value) : ""
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

