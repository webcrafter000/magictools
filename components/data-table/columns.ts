export interface DataTableColumn {
  accessorKey: string;
  header: string;
  cell?: ({ row }: { row: any }) => React.ReactNode;
}