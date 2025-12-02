import { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
  RowClickedEvent,
} from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { Task } from './TaskCard';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Filter, Plus, SortAsc } from 'lucide-react';

import 'ag-grid-community/styles/ag-theme-quartz.css';

// Ensure community modules are registered for ag-Grid
ModuleRegistry.registerModules([AllCommunityModule]);

type SubWorkItemsGridProps = {
  parentTask: Task;
  items: Task[];
};

export function SubWorkItemsGrid({ parentTask, items }: SubWorkItemsGridProps) {
  const [collapsed, setCollapsed] = useState(false);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Key', field: 'key', width: 90 },
      { headerName: 'Title', field: 'content', flex: 1, minWidth: 160 },
      {
        headerName: 'Status',
        field: 'columnId',
        width: 110,
        valueFormatter: (params: ValueFormatterParams<Task>) => {
          const value = params.value as Task['columnId'];
          if (value === 'in-progress') return 'In progress';
          if (value === 'done') return 'Done';
          return 'Todo';
        },
      },
      { headerName: 'Due date', field: 'dueDate', width: 120 },
      {
        headerName: 'Assignee',
        field: 'assignees',
        width: 120,
        valueGetter: (params: ValueGetterParams<Task>) => params.data?.assignees?.[0]?.initials ?? '',
      },
      {
        headerName: 'Actions',
        width: 90,
        cellRenderer: () => <span className="text-gray-400 text-sm">•••</span>,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      suppressMovable: true,
      cellClass: 'text-[13px]',
      headerClass: 'text-xs text-gray-600',
    }),
    []
  );

  const doneCount = items.filter((item) => item.columnId === 'done').length;
  const totalCount = items.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-gray-600 hover:text-gray-900"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <span className="font-semibold text-gray-900">Sub-work items</span>
          <span className="text-gray-500 text-xs">
            {doneCount}/{totalCount} Done
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="p-1 text-gray-500 hover:text-gray-900">
            <SortAsc className="w-4 h-4" />
          </button>
          <button type="button" className="p-1 text-gray-500 hover:text-gray-900">
            <Filter className="w-4 h-4" />
          </button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={() => console.log('Add sub-work item to', parentTask.id)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="ag-theme-quartz h-56 border rounded-lg overflow-hidden text-sm">
          <AgGridReact
            rowData={items}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection={{ mode: 'singleRow' }}
            headerHeight={32}
            rowHeight={36}
            onRowClicked={(event: RowClickedEvent<Task>) => {
              if (event.data?.id) {
                console.log('Sub task clicked', event.data.id);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
