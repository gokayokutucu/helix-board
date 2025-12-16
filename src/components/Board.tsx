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

export type ColumnId = string;


// Types coming from the API
type ApiBoardColumn = {
  id: string;
  title: string;
};

type ApiBoardAssignee = {
  initials?: string;
  name?: string;
  color?: string;
};

type ApiBoardTask = {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  key?: string;
  importance?: string;
  dueDate?: string;
  assignees?: ApiBoardAssignee[];
    permalink?: string;
  rawWrikeStatus?: string;
};


const defaultCols: Column[] = [];
const initialTasks: Task[] = [];

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
       type RectWithTranslated = DOMRect & { translated?: DOMRect };

const translatedRect = (rect as RectWithTranslated | null)?.translated;

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
  const previousTasks = useRef<Task[]>(initialTasks);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [minColumnTaskCount, setMinColumnTaskCount] = useState(() => getMinColumnTaskCount(defaultCols, initialTasks));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const estimatedMinHeight = useMemo(() => minColumnTaskCount * CARD_HEIGHT, [minColumnTaskCount]);
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';

  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
const [taskDetailsError, setTaskDetailsError] = useState<string | null>(null);


  useEffect(() => {
    const controller = new AbortController();
    const folderId = 'MQAAAABn3rdj';

    async function loadBoard() {
      try {
        const resp = await fetch(`${apiBase}/api/board/folders/${folderId}`, { signal: controller.signal });
        if (!resp.ok) {
          throw new Error(`Board load failed with status ${resp.status}`);
        }
        const data = await resp.json();
        console.log('Board payload', data);
        const mappedColumns: Column[] = (data.columns ?? []).map((c: ApiBoardColumn) => ({
  id: c.id,
  title: c.title,
}));

        const columnTitleMap = Object.fromEntries(mappedColumns.map((c) => [c.id, c.title]));

      const mappedTasks: Task[] = (data.tasks ?? []).map((t: ApiBoardTask) => ({
  id: t.id,
  columnId: t.columnId,
  columnTitle: columnTitleMap[t.columnId] ?? t.columnId,
  content: t.title,
  description: t.description,
  key: t.key ?? t.id,
  priority: t.importance?.toLowerCase?.() === 'high' ? 'high' : undefined,
  dueDate: t.dueDate ? formatDate(t.dueDate) : undefined,
  assignees: (t.assignees ?? []).map((a: ApiBoardAssignee) => ({
    initials: a.initials ?? a.name?.slice(0, 2)?.toUpperCase?.() ?? '??',
    color: a.color ?? '#64748b',
  })),
    permalink: t.permalink,       // from BoardTaskDto
  rawStatus: t.rawWrikeStatus,  // from BoardTaskDto
}));


        setColumns(mappedColumns);
        setTasks(mappedTasks);
        setMinColumnTaskCount(getMinColumnTaskCount(mappedColumns, mappedTasks));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
      }
    }

    loadBoard();
    return () => controller.abort();
  }, [apiBase]);

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

async function fetchTaskDetails(taskId: string) {
  if (!apiBase) return;

  try {
    setLoadingTaskId(taskId);
    setTaskDetailsError(null);

    const resp = await fetch(`${apiBase}/api/board/tasks/${taskId}`);

    if (!resp.ok) {
      throw new Error(`Failed to load task details (status ${resp.status})`);
    }

    const dto = (await resp.json()) as ApiBoardTask;


    // dto is a BoardTaskDto from the API
    setTasks((prev) =>
  prev.map((t) =>
    t.id === dto.id
      ? {
          ...t,
          content: dto.title,
          description: dto.description,
          key: dto.key ?? dto.id,
          priority:
            dto.importance?.toLowerCase?.() === 'high'
              ? 'high'
              : dto.importance?.toLowerCase?.() === 'medium'
              ? 'medium'
              : dto.importance?.toLowerCase?.() === 'low'
              ? 'low'
              : undefined,
          dueDate: dto.dueDate ? formatDate(dto.dueDate) : undefined,
          assignees: (dto.assignees ?? []).map((a: ApiBoardAssignee) => ({
            initials:
              a.initials ??
              a.name?.slice(0, 2)?.toUpperCase?.() ??
              '??',
            color: a.color ?? '#64748b',
          })),
          permalink: dto.permalink,
          rawStatus: dto.rawWrikeStatus,
        }
      : t
  )
);

  } catch (err) {
    console.error(err);
    setTaskDetailsError(
      err instanceof Error ? err.message : 'Unknown error while loading details'
    );
  } finally {
    setLoadingTaskId(null);
  }
}


 const handleSelectTask = (taskId: string) => {
  // open panel immediately with whatever data we already have
  setSelectedTaskId(taskId);
  setIsPanelMaximized(false);

  // then fetch richer details from the API (will update tasks array)
  void fetchTaskDetails(taskId);
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
  <>
    {loadingTaskId === selectedTask.id && (
      <div className="fixed right-4 bottom-4 z-40 rounded bg-slate-900 text-white px-3 py-1 text-sm shadow">
        Loading task details…
      </div>
    )}

    {taskDetailsError && (
      <div className="fixed right-4 bottom-16 z-40 rounded bg-red-600 text-white px-3 py-1 text-sm shadow">
        {taskDetailsError}
      </div>
    )}

    <TaskDetailWindow
      task={selectedTask}
      onClose={handleClosePanel}
      onToggleMaximize={handleMaximizeToggle}
      maximized={isPanelMaximized}
    />
  </>
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
      previousTasks.current = tasks.map((t) => ({ ...t }));
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
    if (isActiveAColumn) {
      setColumns((cols) => {
        const activeColumnIndex = cols.findIndex((col) => col.id === activeId);

        const overColumnIndex = cols.findIndex((col) => col.id === overId);

        return arrayMove(cols, activeColumnIndex, overColumnIndex);
      });
      return;
    }

    const isActiveATask = activeData?.type === 'Task';
    if (!isActiveATask) return;

    const overData = over.data.current;
    const targetColumnId =
      overData?.type === 'Task'
        ? overData.task.columnId
        : overData?.type === 'Column'
          ? (over.id as ColumnId)
          : activeData.task.columnId;

    const fromColumnId = pickedUpTaskColumn.current;
    if (!fromColumnId || !targetColumnId || fromColumnId === targetColumnId) return;

    persistTaskMove(String(active.id), fromColumnId, targetColumnId);
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
        activeTaskData.columnTitle = columns.find((c) => c.id === targetColumnId)?.title ?? activeTaskData.columnTitle;

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

  async function persistTaskMove(taskId: string, from: ColumnId, to: ColumnId) {
    try {
      const resp = await fetch(`${apiBase}/api/board/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      });
      if (!resp.ok) {
        throw new Error(`Move failed with status ${resp.status}`);
      }
    } catch (err) {
      console.error(err);
      setTasks(previousTasks.current);
    } finally {
      pickedUpTaskColumn.current = null;
    }
  }
}

function formatDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return input;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
