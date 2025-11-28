import type React from 'react';
import type { ColumnId } from './Board';
import type { Task } from './TaskCard';
import { ArrowLeft, Link as LinkIcon, Maximize2, Minimize2, MoreVertical } from 'lucide-react';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface TaskDetailWindowProps {
  task: Task;
  onClose: () => void;
  onToggleMaximize: () => void;
  maximized: boolean;
}

const statusLabels: Record<ColumnId, { label: string; tone: string }> = {
  todo: { label: 'Todo', tone: 'bg-gray-100 text-gray-800 border-gray-200' },
  'in-progress': { label: 'In progress', tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  done: { label: 'Done', tone: 'bg-green-50 text-green-700 border-green-200' },
};

const priorityLabel: Record<NonNullable<Task['priority']>, { label: string; tone: string }> = {
  high: { label: 'High', tone: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function TaskDetailWindow({ task, onClose, onToggleMaximize, maximized }: TaskDetailWindowProps) {
  const containerClasses = maximized
    ? 'fixed top-0 right-0 bottom-0 left-64 md:left-64 z-40 bg-white shadow-2xl'
    : 'fixed top-0 right-0 h-full w-full md:w-[45%] max-w-4xl z-40 bg-white shadow-2xl border-l';

  return (
    <aside className={containerClasses}>
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleMaximize}>
            {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Subscribe
          </Button>
          <Button variant="ghost" size="icon">
            <LinkIcon className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Make a copy</DropdownMenuItem>
              <DropdownMenuItem>Open new tab</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="h-[calc(100%-56px)] flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium tracking-wide">
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200">{task.key}</span>
            <Badge variant="outline" className={`${statusLabels[task.columnId].tone} text-xs`}>
              {statusLabels[task.columnId].label}
            </Badge>
            {task.priority && (
              <Badge variant="outline" className={`${priorityLabel[task.priority].tone} text-xs`}>
                {priorityLabel[task.priority].label}
              </Badge>
            )}
            {task.dueDate && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {task.dueDate}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{task.content}</h1>
            <p className="text-sm text-gray-500 mt-1">Work item detail</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              Add sub-task
            </Button>
            <Button variant="secondary" size="sm">
              Add relation
            </Button>
            <Button variant="secondary" size="sm">
              Add link
            </Button>
            <Button variant="secondary" size="sm">
              Attach
            </Button>
            <Button variant="secondary" size="sm">
              Link pages
            </Button>
          </div>

          <Separator />

          <div className="space-y-3 text-gray-700 leading-6">
            {task.description ? (
              <p>{task.description}</p>
            ) : (
              <p className="text-sm text-gray-500">No description added yet.</p>
            )}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="text-sm font-semibold mb-2">Tip</h3>
              <p className="text-sm text-gray-700">
                Create quick updates, share checklists, or attach files so your team stays aligned.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-gray-50/60 px-6 py-5 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Properties</h3>
          <div className="space-y-3 text-sm">
            <PropertyRow label="State">
              <Badge variant="outline" className={`${statusLabels[task.columnId].tone} text-xs`}>
                {statusLabels[task.columnId].label}
              </Badge>
            </PropertyRow>
            <PropertyRow label="Priority">
              {task.priority ? (
                <Badge variant="outline" className={`${priorityLabel[task.priority].tone} text-xs`}>
                  {priorityLabel[task.priority].label}
                </Badge>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </PropertyRow>
            <PropertyRow label="Due date">
              <span className="text-gray-700">{task.dueDate ?? 'No due date'}</span>
            </PropertyRow>
            <PropertyRow label="Assignees">
              <div className="flex -space-x-2">
                {(task.assignees ?? []).map((assignee, index) => (
                  <div
                    key={index}
                    className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white ${assignee.color}`}
                  >
                    {assignee.initials}
                  </div>
                ))}
                {(task.assignees ?? []).length === 0 && <span className="text-gray-400">Unassigned</span>}
              </div>
            </PropertyRow>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
