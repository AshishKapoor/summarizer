import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Article } from "@/types";

const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ getValue }) => (
      <div className="w-12 text-center font-semibold text-slate-600">
        #{getValue<number>()}
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="space-y-1">
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 font-medium text-slate-900 hover:text-blue-600"
        >
          {row.original.title}
          <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        {row.original.latest_summary && (
          <p className="text-slate-600 text-md">
            {row.original.latest_summary.summary_text}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ getValue }) => (
      <div className="text-sm text-slate-700">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "points",
    header: "Points",
    cell: ({ getValue }) => (
      <Badge variant="muted" className="font-mono">
        {getValue<number>()}
      </Badge>
    ),
  },
  {
    accessorKey: "comments_count",
    header: "Comments",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="font-mono">
        {getValue<number>()}
      </Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Posted",
    cell: ({ getValue }) => {
      const date = getValue<string | null>();
      if (!date) return <span className="text-xs text-slate-400">N/A</span>;
      const formatted = new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return <span className="text-xs text-slate-600">{formatted}</span>;
    },
  },
];

interface ArticlesTableProps {
  articles: Article[];
}

export function ArticlesTable({ articles }: ArticlesTableProps) {
  const table = useReactTable({
    data: articles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {table.getFlatHeaders().map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Last
          </Button>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <span>
            {articles.length} total article{articles.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
