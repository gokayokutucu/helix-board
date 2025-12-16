import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import { Calendar, BarChart2, AlertCircle } from 'lucide-react';

import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { ColumnId } from './Board';

export interface Task {
  id: UniqueIdentifier;
  columnId: ColumnId;
  columnTitle?: string;
  content: string;
  key: string;
  dueDate?: string;
  description?: string;
  assignees?: Array<{
    initials: string;
    color: string;
  }>;
  priority?: 'high' | 'medium' | 'low';
    permalink?: string;       // Wrike link
  rawStatus?: string;   
}

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onSelect?: (taskId: string) => void;
}

export type TaskType = 'Task';

export interface TaskDragData {
  type: TaskType;
  task: Task;
}

export function TaskCard({ task, isOverlay, onSelect }: TaskCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    } satisfies TaskDragData,
    attributes: {
      roleDescription: 'Task',
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva('', {
    variants: {
      dragging: {
        over: 'ring-2 opacity-30',
        overlay: 'ring-2 ring-primary',
      },
    },
  });

  const statusLabel = task.columnTitle ?? String(task.columnId);
  const statusClassName = 'bg-gray-50 text-gray-700 border-gray-200';
  const dueDateText = task.dueDate ?? 'No due date';
  const assignees = task.assignees ?? [];

  const handleSelect = () => {
    if (isOverlay) return;
    onSelect?.(task.id as string);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? 'overlay' : isDragging ? 'over' : undefined,
      })}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isOverlay ? -1 : 0}
    >
      <CardHeader
        {...attributes}
        {...listeners}
        className="px-3 py-3 flex flex-row items-center gap-2 space-y-0 border-b-2 border-secondary relative cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {task.priority === 'high' && (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <h3 className="text-sm font-medium text-gray-900 leading-5 truncate">{task.content}</h3>
        </div>
        <Badge variant={'outline'} className="font-semibold flex-shrink-0">
          {task.key}
        </Badge>
      </CardHeader>
      <CardContent className="px-3 pt-2 pb-2 text-left">
        {task.description ? (
          <p className="text-sm text-gray-700 leading-5 line-clamp-3">{task.description}</p>
        ) : null}
      </CardContent>
      <CardFooter className="px-3 pb-4 pt-0 text-left">
        <div className="flex items-center gap-3 text-xs w-full justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-3 h-3 text-gray-400" />
            <Badge variant="outline" className={`text-xs px-2 py-0 border ${statusClassName}`}>
              <div className="flex items-center gap-1">
                <span>{statusLabel}</span>
              </div>
            </Badge>

            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">{dueDateText}</span>
            </div>
          </div>
          <div className="flex items-center -space-x-1">
            {assignees.map((assignee, index) => (
              <Avatar key={index} className="w-6 h-6 border-2 border-white">
                <AvatarFallback
                  className={(assignee.color?.startsWith('#') ? '' : assignee.color) + ' text-white text-xs font-medium'}
                  style={assignee.color?.startsWith('#') ? { backgroundColor: assignee.color } : undefined}
                >
                  {assignee.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
