import { Calendar, AlertCircle, BarChart2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { WorkItem } from '../data/mockData';

export function WorkItemCard({ item, isOverlay = false }: { item: WorkItem; isOverlay?: boolean }) {
  const sortable = isOverlay
    ? {
        attributes: {},
        listeners: {},
        setNodeRef: undefined,
        transform: null,
        transition: undefined,
        isDragging: false,
      }
    : useSortable({
        id: item.id,
        data: {
          type: 'task',
          item,
        },
      });

  const statusConfig = {
    backlog: { label: 'Backlog', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    todo: { label: 'Todo', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    'in-progress': { label: 'In progress', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    done: { label: 'Done', className: 'bg-green-50 text-green-700 border-green-200' },
  };

  const status = statusConfig[item.status as keyof typeof statusConfig];
  const style =
    sortable.transform != null
      ? {
          transform: CSS.Translate.toString(sortable.transform),
          transition: sortable.transition,
        }
      : undefined;

  return (
    <div
      ref={sortable.setNodeRef as (element: HTMLDivElement | null) => void}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
      className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
        sortable.isDragging ? 'opacity-80 ring-2 ring-blue-100 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        {item.priority === 'high' && (
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
        <div className="flex-shrink-0">
          <Badge variant="outline" className="text-xs font-medium border-gray-300 text-gray-700">
            {item.key}
          </Badge>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">{item.title}</h3>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3 h-3 text-gray-400" />
          <Badge
            variant="outline"
            className={`text-xs px-2 py-0 border ${status.className}`}
          >
            <div className="flex items-center gap-1">
              {item.status === 'in-progress' && <span className="text-orange-600">●</span>}
              {item.status === 'done' && <span className="text-green-600">✓</span>}
              {item.status === 'backlog' && <span className="text-gray-400">○</span>}
              {item.status === 'todo' && <span className="text-gray-400">○</span>}
              <span>{status.label}</span>
            </div>
          </Badge>

          <div className="flex items-center gap-1 text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{item.dueDate}</span>
          </div>
        </div>

        <div className="flex items-center -space-x-1">
          {item.assignees.map((assignee, index) => (
            <Avatar key={index} className="w-6 h-6 border-2 border-white">
              <AvatarFallback className={assignee.color + ' text-white text-xs font-medium'}>
                {assignee.initials}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
