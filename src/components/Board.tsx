import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Announcements,
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { BoardColumn, BoardContainer, type Column } from './BoardColumn';
import { coordinateGetter } from './multipleContainersKeyboardPreset';
import { TaskCard, type Task } from './TaskCard';
import { TaskDetailWindow } from './TaskDetailWindow';
import { hasDraggableData } from './utils';

const defaultCols = [
  {
    id: 'todo' as const,
    title: 'Todo',
  },
  {
    id: 'in-progress' as const,
    title: 'In progress',
  },
  {
    id: 'done' as const,
    title: 'Done',
  },
] satisfies Column[];

export type ColumnId = (typeof defaultCols)[number]['id'];

const initialTasks: Task[] = [
  {
    id: 'task1',
    columnId: 'done',
    content: 'Project initiation and planning',
    description: 'Project initiation and planning',
    key: 'ENA 14',
    priority: 'high',
    dueDate: '15 Apr, 2025',
    assignees: [{ initials: 'JD', color: 'bg-blue-600' }],
  },
  {
    id: 'task2',
    columnId: 'done',
    content: 'Gather requirements from stakeholders',
    description: 'Gather requirements from stakeholders',
    key: 'CON 20',
    dueDate: '12 Apr, 2025',
    assignees: [
      { initials: 'MR', color: 'bg-green-600' },
      { initials: 'AL', color: 'bg-orange-600' },
    ],
  },
  {
    id: 'task3',
    columnId: 'done',
    content: 'Create wireframes and mockups',
    description: 'Create wireframes and mockups',
    key: 'CON 24',
    dueDate: '10 Apr, 2025',
    assignees: [{ initials: 'RG', color: 'bg-teal-600' }],
  },
  {
    id: 'task4',
    columnId: 'in-progress',
    content: 'Develop homepage layout',
    description: 'Develop homepage layout',
    key: 'DES 42',
    dueDate: '22 Apr, 2025',
    assignees: [{ initials: 'SB', color: 'bg-purple-600' }],
  },
  {
    id: 'task5',
    columnId: 'in-progress',
    content: 'Design color scheme and typography',
    description: 'Design color scheme and typography',
    key: 'DES 65',
    priority: 'high',
    dueDate: '25 Apr, 2025',
    assignees: [{ initials: 'TK', color: 'bg-green-600' }],
  },
  {
    id: 'task6',
    columnId: 'todo',
    content: 'Implement user authentication',
    description: 'Implement user authentication',
    key: 'CON 51',
    dueDate: '28 Apr, 2025',
    assignees: [
      { initials: 'DM', color: 'bg-orange-600' },
      { initials: 'NK', color: 'bg-indigo-600' },
    ],
  },
  {
    id: 'task7',
    columnId: 'todo',
    content: 'Build contact us page',
    description: 'Build contact us page',
    key: 'CAM 80',
    dueDate: '30 Apr, 2025',
    assignees: [{ initials: 'JD', color: 'bg-blue-600' }],
  },
  {
    id: 'task8',
    columnId: 'todo',
    content: 'Create product catalog',
    description: 'Create product catalog',
    key: 'CON 75',
    dueDate: '02 May, 2025',
    assignees: [{ initials: 'AL', color: 'bg-green-600' }],
  },
  {
    id: 'task9',
    columnId: 'todo',
    content: 'Develop about us page',
    description: 'Develop about us page',
    key: 'DES 32',
    dueDate: '06 May, 2025',
    assignees: [
      { initials: 'RG', color: 'bg-teal-600' },
      { initials: 'PL', color: 'bg-amber-600' },
    ],
  },
  {
    id: 'task10',
    columnId: 'todo',
    content: 'Optimize website for mobile devices',
    description: 'Optimize website for mobile devices',
    key: 'ENA 37',
    dueDate: '08 May, 2025',
    assignees: [{ initials: 'LH', color: 'bg-red-600' }],
  },
  {
    id: 'task11',
    columnId: 'todo',
    content: 'Integrate payment gateway',
    description: 'Integrate payment gateway',
    key: 'ENA 39',
    dueDate: '12 May, 2025',
    assignees: [{ initials: 'MK', color: 'bg-cyan-600' }],
  },
  {
    id: 'task12',
    columnId: 'todo',
    content: 'Perform testing and bug fixing',
    description: 'Perform testing and bug fixing',
    key: 'CAM 70',
    dueDate: '15 May, 2025',
    assignees: [
      { initials: 'SB', color: 'bg-purple-600' },
      { initials: 'TW', color: 'bg-indigo-600' },
    ],
  },
  {
    id: 'task13',
    columnId: 'todo',
    content: 'Launch website and deploy to server',
    description: 'Launch website and deploy to server',
    key: 'CAM 75',
    dueDate: '20 May, 2025',
    assignees: [
      { initials: 'MR', color: 'bg-green-600' },
      { initials: 'AL', color: 'bg-orange-600' },
    ],
  },
];

const CARD_HEIGHT = 140;
const MIN_CARD_ROWS = 1.5;

function getMinColumnTaskCount(cols: Column[], tasks: Task[]) {
  const maxTasks = getMaxTasksPerColumn(cols, tasks);
  return Math.max(maxTasks + MIN_CARD_ROWS, MIN_CARD_ROWS);
}

const collisionDetectionStrategy: CollisionDetection = (args) => {
  const { active, droppableContainers, pointerCoordinates } = args;
  if (!active) return [];

  const activeType = active.data.current?.type;
  if (activeType === 'Column') {
    return closestCenter(args);
  }

  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0 && pointerCoordinates) {
    const prioritized = pointerCollisions
      .map((collision) => {
        const container = droppableContainers.find((item) => item.id === collision.id);
        const rect = container?.rect.current;
        const translatedRect = (rect as any)?.translated;
        const resolvedRect = translatedRect ?? rect;
        if (!resolvedRect) {
          return { collision, distance: Number.POSITIVE_INFINITY };
        }
        const rectCenter = {
          x: resolvedRect.left + resolvedRect.width / 2,
          y: resolvedRect.top + resolvedRect.height / 2,
        };
        const dx = rectCenter.x - pointerCoordinates.x;
        const dy = rectCenter.y - pointerCoordinates.y;
        const distance = dx * dx + dy * dy;
        return { collision, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    return prioritized.length ? [prioritized[0].collision] : pointerCollisions;
  }

  const intersections = rectIntersection(args);
  if (intersections.length > 0) {
    return [intersections[0]];
  }

  const closest = closestCenter(args);
  const first = getFirstCollision(closest);
  return first ? [first] : [];
};

function getMaxTasksPerColumn(cols: Column[], tasks: Task[]) {
  if (cols.length === 0) return 0;
  return Math.max(
    ...cols.map((col) => tasks.filter((task) => task.columnId === col.id).length),
    0
  );
}

export function Board() {
  const [columns, setColumns] = useState<Column[]>(defaultCols);
  const pickedUpTaskColumn = useRef<ColumnId | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [minColumnTaskCount, setMinColumnTaskCount] = useState(() => getMinColumnTaskCount(defaultCols, initialTasks));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const estimatedMinHeight = useMemo(() => minColumnTaskCount * CARD_HEIGHT, [minColumnTaskCount]);

  useEffect(() => {
    if (isDraggingTask) return;
    setMinColumnTaskCount(getMinColumnTaskCount(columns, tasks));
  }, [columns, tasks, isDraggingTask]);
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  function getDraggingTaskData(taskId: UniqueIdentifier, columnId: ColumnId) {
    const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
    const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
    const column = columns.find((col) => col.id === columnId);
    return {
      tasksInColumn,
      taskPosition,
      column,
    };
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === 'Column') {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${startColumnIdx + 1} of ${columnsId.length}`;
      } else if (active.data.current?.type === 'Task') {
        setIsDraggingTask(true);
        pickedUpTaskColumn.current = active.data.current.task.columnId;
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(active.id, pickedUpTaskColumn.current);
        return `Picked up Task ${active.data.current.task.content} at position: ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${
          over.data.current.column.title
        } at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (active.data.current?.type === 'Task' && over.data.current?.type === 'Task') {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task ${active.data.current.task.content} was moved over column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }
        return `Task was moved over position ${taskPosition + 1} of ${tasksInColumn.length} in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpTaskColumn.current = null;
        setIsDraggingTask(false);
        return;
      }
      if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);

        return `Column ${active.data.current.column.title} was dropped into position ${overColumnPosition + 1} of ${
          columnsId.length
        }`;
      } else if (active.data.current?.type === 'Task' && over.data.current?.type === 'Task') {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task was dropped into column ${column?.title} in position ${taskPosition + 1} of ${
            tasksInColumn.length
          }`;
        }
        return `Task was dropped into position ${taskPosition + 1} of ${tasksInColumn.length} in column ${column?.title}`;
      }
      pickedUpTaskColumn.current = null;
      setIsDraggingTask(false);
    },
    onDragCancel({ active }) {
      pickedUpTaskColumn.current = null;
      setIsDraggingTask(false);
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsPanelMaximized(false);
  };

  const handleClosePanel = () => {
    setSelectedTaskId(null);
    setIsPanelMaximized(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleMaximizeToggle = () => {
    if (!selectedTaskId) return;
    const basePath = window.location.pathname;
    if (isPanelMaximized) {
      setIsPanelMaximized(false);
      window.history.replaceState({}, '', basePath);
    } else {
      setIsPanelMaximized(true);
      window.history.pushState({ taskId: selectedTaskId }, '', `${basePath}?task=${selectedTaskId}`);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <DndContext
        accessibility={{
          announcements,
        }}
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        {selectedTask && !isPanelMaximized && (
          <div className="fixed inset-0 bg-black/5 z-30" onClick={handleClosePanel} />
        )}
        <BoardContainer>
          <SortableContext items={columnsId}>
            {columns.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={tasks.filter((task) => task.columnId === col.id)}
                estimatedMinHeight={estimatedMinHeight}
                onSelectTask={handleSelectTask}
              />
            ))}
          </SortableContext>
        </BoardContainer>

        {selectedTask && (
          <TaskDetailWindow
            task={selectedTask}
            onClose={handleClosePanel}
            onToggleMaximize={handleMaximizeToggle}
            maximized={isPanelMaximized}
          />
        )}

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeColumn && (
                <BoardColumn
                  isOverlay
                  column={activeColumn}
                  tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
                  estimatedMinHeight={estimatedMinHeight}
                />
              )}
              {activeTask && <TaskCard task={activeTask} isOverlay />}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === 'Column') {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === 'Task') {
      setIsDraggingTask(true);
      setActiveTask(data.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);
    setIsDraggingTask(false);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === 'Column';
    if (!isActiveAColumn) return;

    setColumns((cols) => {
      const activeColumnIndex = cols.findIndex((col) => col.id === activeId);

      const overColumnIndex = cols.findIndex((col) => col.id === overId);

      return arrayMove(cols, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === 'Task';
    const isOverATask = overData?.type === 'Task';

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      setTasks((allTasks) => {
        const activeIndex = allTasks.findIndex((t) => t.id === activeId);
        const overIndex = allTasks.findIndex((t) => t.id === overId);
        const activeTaskData = allTasks[activeIndex];
        const overTask = allTasks[overIndex];
        if (activeTaskData && overTask && activeTaskData.columnId !== overTask.columnId) {
          activeTaskData.columnId = overTask.columnId;
          return arrayMove(allTasks, activeIndex, overIndex - 1);
        }

        return arrayMove(allTasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = overData?.type === 'Column';

    // Determine whether drop is closer to column header or footer
    const translatedRect = event.active.rect.current.translated;
    const initialRect = event.active.rect.current.initial;
    const overRect = event.over?.rect;
    const activeCenterY =
      translatedRect && typeof translatedRect.top === 'number'
        ? translatedRect.top + translatedRect.height / 2
        : initialRect && typeof initialRect.top === 'number'
          ? initialRect.top + event.delta.y + initialRect.height / 2
          : null;
    const overMidY =
      overRect && typeof overRect.top === 'number'
        ? overRect.top + overRect.height / 2
        : null;
    const preferInsertAt =
      activeCenterY !== null && overMidY !== null ? (activeCenterY < overMidY ? 'start' : 'end') : 'start';

    if (isActiveATask && isOverAColumn) {
      setTasks((allTasks) => {
        const activeIndex = allTasks.findIndex((t) => t.id === activeId);
        const activeTaskData = allTasks[activeIndex];
        if (!activeTaskData) return allTasks;

        const updated = [...allTasks];
        updated.splice(activeIndex, 1);

        const targetColumnId = overId as ColumnId;
        activeTaskData.columnId = targetColumnId;

        const targetIndexes = updated
          .map((t, index) => (t.columnId === targetColumnId ? index : -1))
          .filter((index) => index !== -1);
        const firstTargetIndex = targetIndexes[0];
        const lastTargetIndex = targetIndexes[targetIndexes.length - 1];

        const safeInsertIndex =
          targetIndexes.length === 0
            ? updated.length
            : preferInsertAt === 'start'
              ? firstTargetIndex
              : lastTargetIndex + 1;

        updated.splice(safeInsertIndex, 0, activeTaskData);
        return updated;
      });
    }
  }
}
