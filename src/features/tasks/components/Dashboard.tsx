import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteTasksQuery, useDeleteTaskMutation, useToggleCompleteMutation, type Task } from '../api/tasks.api';

// Create a local Task type to allow missing arrays from backend
type AppTask = Omit<Task, 'tags'> & { tags?: any[]; startDate?: string; endDate?: string; colorClass?: string; };

// Set to 'empty' | 'data' | 'real' for testing. Keep 'real' in production.
const MOCK_SCENARIO = 'real' as 'empty' | 'data' | 'real';

const MOCK_TASKS: AppTask[] = [
  {
    id: '1',
    title: 'Revisión de manuscrito: Capítulo 4',
    description: 'Revisar la coherencia argumentativa del cuarto capítulo centrado en el impacto de la curaduría algorítmica en las colecciones digitales contemporáneas.',
    priority: 'high',
    completed: false,
    userId: 'u1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [{ id: 't1', name: 'Inteligencia Artificial', color: '#5959A0', userId: 'u1' }],
  },
  {
    id: '2',
    title: 'Preparar bibliografía del archivo digital',
    description: 'Compilar y formatear todas las referencias en formato Chicago 17ª edición.',
    priority: 'medium',
    completed: false,
    userId: 'u1',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday = overdue
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: [],
  },
  {
    id: '3',
    title: 'Entrevista con el Curador del Museo',
    description: 'Reunión programada para discutir la exposición de fotografía del siglo XX.',
    priority: 'medium',
    completed: true,
    userId: 'u1',
    createdAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    updatedAt: new Date(Date.now() + 86400000).toISOString(),
    tags: [{ id: 't2', name: 'Cita', color: '#003C4E', userId: 'u1' }],
  },
  {
    id: '4',
    title: 'Investigar influencias del arte barroco en interfaces digitales',
    description: 'Análisis comparativo entre el ornamento barroco y los patrones de diseño de UI contemporáneos.',
    priority: 'low',
    completed: false,
    userId: 'u1',
    createdAt: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days later
    updatedAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    tags: [{ id: 't3', name: 'Estética', color: '#365BAA', userId: 'u1' }],
  },
  {
    id: '5',
    title: 'Actualizar bibliografía de Walter Benjamin',
    description: 'Incorporar las nuevas ediciones críticas publicadas en 2023.',
    priority: 'low',
    completed: false,
    userId: 'u1',
    createdAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    tags: [],
  },
];

// ─── Priority Config ──────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<Task['priority'], { label: string; className: string }> = {
  urgent: {
    label: 'Urgente',
    className: 'bg-error text-white hover:bg-error/90',
  },
  high: {
    label: 'Alta Prioridad',
    className: 'bg-error-container text-on-error-container hover:bg-error-container',
  },
  medium: {
    label: 'Media',
    className: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container',
  },
  low: {
    label: 'Baja',
    className:
      'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((taskDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return '⚠ ATRASADAS';
  if (diffDays === 0) return 'HOY';
  if (diffDays === 1) return 'MAÑANA';
  return 'PRÓXIMAMENTE';
}

/** Returns the date used for grouping: startDate takes priority, falls back to createdAt */
function getTaskGroupDate(task: AppTask): string {
  return task.startDate || task.createdAt || new Date().toISOString();
}

function groupTasksByDate(tasks: AppTask[]): Record<string, AppTask[]> {
  const order = ['⚠ ATRASADAS', 'HOY', 'MAÑANA', 'PRÓXIMAMENTE'];
  const groups: Record<string, AppTask[]> = {};
  for (const task of tasks) {
    let label = getDateLabel(getTaskGroupDate(task));
    // Completed tasks are never overdue — move them to a neutral bucket
    if (task.completed && label === '⚠ ATRASADAS') label = 'PRÓXIMAMENTE';
    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
  }
  // Sort keys by priority order
  return Object.fromEntries(
    order.filter((k) => groups[k]).map((k) => [k, groups[k]])
  );
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSkeletons() {
  return (
    <div className="space-y-12">
      {/* Activity summary skeletons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </section>

      {/* Filter pill skeletons */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-px flex-1 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center gap-8">
      {/* Decorative vault icon */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-primary-container/20 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/30 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-5xl text-primary"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              shelves
            </span>
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-outline-variant text-base">
            add_circle
          </span>
        </div>
      </div>

      <div className="max-w-sm space-y-3">
        <h2 className="font-headline text-3xl font-bold italic text-primary">
          La bóveda está vacía
        </h2>
        <p className="font-body text-on-surface-variant leading-relaxed">
          Aún no tienes notas registradas. Cada gran obra comienza con una sola idea. Es momento de
          capturar la tuya.
        </p>
      </div>

      <button
        id="empty-state-create-btn"
        onClick={() => navigate('/tasks/new')}
        className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-[#ffffff] font-headline font-bold text-lg shadow-xl shadow-primary/20 hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
        Crear tu primera nota
      </button>

      <p className="font-label text-[10px] uppercase tracking-widest text-outline-variant italic">
        Protocolo de Iniciación — Notas Arranca
      </p>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: AppTask;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
}

function TaskCard({ task, isExpanded, onToggle, onDelete, onToggleComplete, onEdit }: TaskCardProps) {
  const priority = PRIORITY_MAP[task.priority];
  const isOverdue = getDateLabel(getTaskGroupDate(task)) === '⚠ ATRASADAS';

  if (isExpanded) {
    return (
      <Card
        id={`task-card-${task.id}`}
        className={`bg-surface-container-lowest border-2 border-primary-container rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
          task.completed ? 'opacity-60' : ''
        }`}
      >
        <div className="p-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                  className="h-7 w-7 rounded border-outline-variant text-primary focus:ring-primary-container bg-surface transition-all cursor-pointer"
                  aria-label="Marcar como completada"
                />
              </div>
              <div>
                <h5
                  className={`text-3xl font-headline font-bold text-primary leading-tight ${
                    task.completed ? 'line-through text-outline' : ''
                  }`}
                >
                  {task.title}
                </h5>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className={`font-label text-[10px] px-2.5 py-1 rounded uppercase tracking-wider ${priority.className}`}>
                    {priority.label}
                  </Badge>
                  {(task.tags || []).map((tag) => (
                    <span
                      key={tag.id}
                      className="font-label text-[10px] px-2.5 py-1 rounded bg-primary-container/10 text-primary uppercase tracking-wider hover:bg-primary-container/10 border"
                      style={{ borderLeft: `3px solid ${tag.color}` }}
                    >
                      <span className="material-symbols-outlined text-xs mr-1">local_offer</span>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="p-3 hover:bg-surface-container-high rounded-full text-primary transition-colors border border-outline-variant/30"
                aria-label="Editar tarea"
                onClick={() => onEdit(task.id)}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                className="p-3 hover:bg-error/10 rounded-full text-error transition-colors border border-error/20"
                aria-label="Eliminar tarea"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
                    onDelete(task.id);
                  }
                }}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>

          {/* Description + Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-outline-variant/10">
            <div className="md:col-span-2">
              <h6 className="font-label text-xs font-bold text-secondary uppercase tracking-widest mb-3 italic">
                Descripción Detallada
              </h6>
              <p className="text-on-surface-variant leading-relaxed font-body">
                {task.description || 'Sin descripción proporcionada.'}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <h6 className="font-label text-xs font-bold text-secondary uppercase tracking-widest mb-3 italic">
                  Cronograma
                </h6>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-xl">
                      event_upcoming
                    </span>
                    <div>
                      <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold">
                        Fecha de Creación
                      </p>
                      <p className="font-medium font-body">{formatDateTime(task.createdAt || new Date().toISOString())}</p>
                    </div>
                  </div>
                  {task.updatedAt && task.updatedAt !== task.createdAt && (
                    <div className="flex items-center gap-3 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-xl">
                        update
                      </span>
                      <div>
                        <p className="font-label text-[10px] text-on-surface-variant uppercase font-bold">
                          Última Actualización
                        </p>
                        <p className="font-medium font-body">{formatDateTime(task.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="bg-primary-container px-8 py-3 flex justify-between items-center">
          <span className="font-label text-[10px] text-white/70 font-bold uppercase tracking-widest">
            Modo Edición Avanzada
          </span>
          <button
            id={`task-close-${task.id}`}
            onClick={onToggle}
            className="text-white text-xs font-bold flex items-center gap-1 hover:underline"
          >
            Cerrar Detalles{' '}
            <span className="material-symbols-outlined text-sm rotate-180">expand_more</span>
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      id={`task-card-${task.id}`}
      onClick={onToggle}
      className={`cursor-pointer transition-all duration-200 p-6 rounded-xl flex items-center gap-6 shadow-sm group border-0 ${
        isOverdue
          ? 'bg-error/5 hover:bg-error/10 border-l-4 border-error rounded-l-none'
          : 'bg-surface-container-lowest hover:bg-surface-container'
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={task.completed}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id, e.target.checked);
          }}
          className={`h-6 w-6 rounded bg-surface cursor-pointer ${
            isOverdue
              ? 'border-error/30 text-error focus:ring-error/20'
              : 'border-outline-variant text-primary focus:ring-primary-container'
          }`}
          aria-label="Marcar como completada"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h5
          className={`text-xl font-headline text-primary group-hover:translate-x-1 transition-transform truncate ${
            task.completed ? 'line-through text-outline' : ''
          }`}
        >
          {task.title}
        </h5>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {isOverdue && (
            <Badge className="font-label text-[10px] px-2 py-0.5 rounded bg-error text-white uppercase tracking-wider hover:bg-error">
              VENCIDO
            </Badge>
          )}
          <Badge className={`font-label text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${priority.className}`}>
            {priority.label}
          </Badge>
          <span className="flex items-center gap-1 font-label text-xs text-on-surface-variant bg-surface-container-high px-2 rounded">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {formatDateTime(getTaskGroupDate(task))}
          </span>
          {(task.tags || []).slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 font-label text-[10px] px-2 py-0.5 rounded bg-primary-container/10 text-primary uppercase tracking-wider"
              style={{ borderLeft: `2px solid ${tag.color}` }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors shrink-0">
        expand_more
      </span>
    </Card>
  );
}

function GroupLabel({ label, taskCount }: { label: string; taskCount: number }) {
  const isOverdue = label === '⚠ ATRASADAS';

  if (isOverdue) {
    return (
      <div className="rounded-xl overflow-hidden mb-6">
        {/* Alert banner */}
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-error/15 via-error/10 to-transparent border border-error/30 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            {/* Pulsing live dot */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
            </span>
            {/* Animated warning icon */}
            <span
              className="material-symbols-outlined text-error text-xl animate-bounce"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div>
              <p className="font-label text-xs font-black tracking-[0.2em] text-error uppercase">
                Tareas Atrasadas
              </p>
              <p className="font-label text-[10px] text-error/70 mt-0.5">
                Requieren atención inmediata
              </p>
            </div>
          </div>
          <span className="shrink-0 font-headline font-black text-2xl text-error">
            {taskCount}
            <span className="font-label font-normal text-xs text-error/70 ml-1">
              {taskCount === 1 ? 'tarea' : 'tareas'}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="font-label text-xs font-black tracking-[0.2em] flex items-center gap-2 text-secondary">
        {label}
      </span>
      <div className="h-px flex-1 opacity-10 bg-outline-variant" />
      <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
        {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}
      </span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const queryResult = useInfiniteTasksQuery();
  const deleteMutation = useDeleteTaskMutation();
  const toggleCompleteMutation = useToggleCompleteMutation();

  // ── Infinite scroll: fetch next page when sentinel enters viewport ────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
          queryResult.fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [queryResult.hasNextPage, queryResult.isFetchingNextPage, queryResult.fetchNextPage]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setExpandedId(null),
    });
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleCompleteMutation.mutate({ id, completed });
  };

  const handleEdit = (id: string) => {
    navigate(`/tasks/${id}/edit`);
  };

  // ── Flatten all pages into a single array ─────────────────────────────────
  const allTasks: AppTask[] =
    MOCK_SCENARIO === 'data'
      ? MOCK_TASKS
      : MOCK_SCENARIO === 'empty'
      ? []
      : (queryResult.data?.pages.flatMap((p) => p.data) ?? []);

  const totalCount = queryResult.data?.pages[0]?.meta?.total ?? 0;
  const isLoading = MOCK_SCENARIO === 'real' ? queryResult.isLoading : false;
  const isError = MOCK_SCENARIO === 'real' ? queryResult.isError : false;

  const filteredTasks = allTasks.filter((t: AppTask) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    return true;
  });

  const grouped = groupTasksByDate(filteredTasks);

  const completedCount = allTasks.filter((t: AppTask) => t.completed).length;
  const pendingCount = allTasks.filter((t: AppTask) => !t.completed).length;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {/* ── Top NavBar ── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight font-headline text-primary antialiased italic">
            Notas Arranca
          </h1>
          <div className="flex items-center gap-4">
            <span className="font-label text-[10px] text-outline uppercase tracking-widest hidden sm:block">
              El Curador Digital
            </span>
            <button
              id="logout-btn"
              onClick={() => (window.location.href = '/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/30 font-label text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-24 pb-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          {isLoading ? (
            <LoadingSkeletons />
          ) : isError ? (
            /* Error state */
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-error">wifi_off</span>
              </div>
              <div>
                <h2 className="font-headline text-2xl text-primary font-bold italic">
                  Error de Conexión
                </h2>
                <p className="font-body text-on-surface-variant mt-2">
                  No se pudo comunicar con la bóveda. Verifica tu conexión.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-primary text-[#ffffff] font-label text-sm font-bold uppercase tracking-wider hover:opacity-90 transition"
              >
                Reintentar
              </button>
            </div>
          ) : allTasks.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ── Activity Summary ── */}
              <section className="mb-16">
                <div className="flex items-baseline justify-between mb-8">
                  <h3 className="text-3xl font-headline font-bold text-primary italic">
                    Resumen de Actividad
                  </h3>
                  <div className="h-px flex-1 mx-8 bg-outline-variant opacity-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pending card */}
                  <div className="bg-surface-container-low p-8 rounded-xl flex items-center justify-between group hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-label text-sm text-secondary font-medium tracking-wide mb-2 uppercase">
                        Por Completar
                      </p>
                      <h4 className="text-5xl font-headline font-black text-primary">
                        {pendingCount}{' '}
                        <span className="text-2xl font-normal text-on-surface-variant italic">
                          pendientes
                        </span>
                      </h4>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-4xl">pending_actions</span>
                    </div>
                  </div>

                  {/* Completed card */}
                  <div className="bg-primary-container p-8 rounded-xl flex items-center justify-between overflow-hidden relative hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-br from-primary to-secondary" />
                    <div className="relative z-10">
                      <p className="font-label text-sm text-[#ffffff]/80 font-medium tracking-wide mb-2 uppercase">
                        Completadas
                      </p>
                      <h4 className="text-5xl font-headline font-black text-[#ffffff]">
                        {completedCount}{' '}
                        <span className="text-2xl font-normal text-[#ffffff]/60 italic">
                          listas
                        </span>
                      </h4>
                    </div>
                    <div className="relative z-10 w-16 h-16 rounded-full bg-[#ffffff]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-[#ffffff]">
                        task_alt
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Filters ── */}
              <div className="flex flex-wrap items-center gap-2 mb-8 px-2" role="group" aria-label="Filtros de tareas">
                {(
                  [
                    { key: 'all', label: 'Todas' },
                    { key: 'pending', label: 'Pendientes' },
                    { key: 'completed', label: 'Completadas' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    id={`filter-${key}`}
                    onClick={() => setFilter(key)}
                    className={`font-label text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all active:scale-95 ${
                      filter === key
                        ? 'bg-primary-container text-[#ffffff] shadow-lg shadow-primary-container/20'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Task Groups ── */}
              <section className="space-y-12">
                {filteredTasks.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-4">
                      filter_list_off
                    </span>
                    <p className="font-label text-sm text-on-surface-variant uppercase tracking-widest italic">
                      No hay notas en esta vista
                    </p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([groupLabel, groupTasks]) => (
                    <div key={groupLabel} className="space-y-4">
                      <GroupLabel label={groupLabel} taskCount={groupTasks.length} />
                      {groupTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isExpanded={expandedId === task.id}
                          onToggle={() =>
                            setExpandedId(expandedId === task.id ? null : task.id)
                          }
                          onDelete={handleDelete}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleEdit}
                        />
                      ))}
                    </div>
                  ))
                )}

                {/* Infinite scroll sentinel + loading indicator */}
                <div ref={sentinelRef} className="h-1" />
                {queryResult.isFetchingNextPage && (
                  <div className="py-8 flex justify-center">
                    <div className="flex items-center gap-3 text-outline">
                      <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
                      <span className="font-label text-xs uppercase tracking-widest">Cargando más notas...</span>
                    </div>
                  </div>
                )}

                {/* Scroll cue */}
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-1 h-12 bg-gradient-to-b from-primary/20 to-transparent rounded-full mb-4" />
                  <p className="font-label text-xs text-outline uppercase tracking-widest italic">
                    {queryResult.hasNextPage
                      ? `${allTasks.length} de ${totalCount} notas cargadas`
                      : `Fin de la bóveda · ${allTasks.length} notas`}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ── FAB: Nueva Nota ── */}
      <button
        id="fab-new-task"
        onClick={() => navigate('/tasks/new')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-[#ffffff] rounded-full shadow-2xl hover:shadow-primary/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group z-50"
        aria-label="Nueva Nota"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
      </button>
    </div>
  );
};
