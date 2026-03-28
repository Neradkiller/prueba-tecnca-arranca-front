import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newTaskSchema, type NewTaskFormValues } from '../schemas/newTask.schema';
import {
  useTaskByIdQuery,
  useUpdateTaskMutation,
  useTagsQuery,
  useCreateTagMutation,
} from '../api/tasks.api';

// ─── Priority Config ───────────────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'low', label: 'Baja', className: 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high focus:ring-outline', selectedClass: 'bg-surface-container-high border-outline' },
  { value: 'medium', label: 'Media', className: 'border-secondary/30 text-secondary hover:bg-secondary/20', selectedClass: 'bg-secondary/10 border-secondary' },
  { value: 'high', label: 'Alta', className: 'border-orange-400/30 text-orange-700 hover:bg-orange-50', selectedClass: 'bg-orange-50 border-orange-400' },
  { value: 'urgent', label: 'Urgente', className: 'border-error/30 text-error hover:bg-error/5', selectedClass: 'bg-error/5 border-error' },
] as const;

// ─── Color Options ────────────────────────────────────────────────────────────
const COLORS = [
  { value: 'primary', bgClass: 'bg-primary', ringClass: 'ring-primary' },
  { value: 'secondary', bgClass: 'bg-secondary', ringClass: 'ring-secondary' },
  { value: 'tertiary', bgClass: 'bg-tertiary', ringClass: 'ring-tertiary' },
  { value: 'accent', bgClass: 'bg-[#87a9fe]', ringClass: 'ring-[#87a9fe]' },
  { value: 'error', bgClass: 'bg-error', ringClass: 'ring-error' },
];

export const EditTaskForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: task, isLoading, isError } = useTaskByIdQuery(id ?? '');
  const updateMutation = useUpdateTaskMutation();
  const createTagMutation = useCreateTagMutation();
  const { data: existingTags = [] } = useTagsQuery();

  const [tagInput, setTagInput] = useState('');

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<NewTaskFormValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      startDate: '',
      endDate: '',
      colorClass: 'primary',
    },
  });

  // Pre-fill form when task data is available
  useEffect(() => {
    if (!task) return;
    reset({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      tags: (task.tags ?? []).map((t: any) => t.id),
      startDate: (task as any).startDate
        ? new Date((task as any).startDate).toISOString().split('T')[0]
        : '',
      endDate: (task as any).endDate
        ? new Date((task as any).endDate).toISOString().split('T')[0]
        : '',
      colorClass: (task as any).colorClass ?? 'primary',
    });
  }, [task, reset]);

  const watchTags = watch('tags') ?? [];
  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  const addTag = async () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const existingMatch = existingTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingMatch) {
      if (!watchTags.includes(existingMatch.id)) {
        setValue('tags', [...watchTags, existingMatch.id]);
      }
      setTagInput('');
      return;
    }
    try {
      const newTag = await createTagMutation.mutateAsync({ name: trimmed, color: '#4f46e5' });
      setValue('tags', [...watchTags, newTag.id]);
      setTagInput('');
    } catch (e) {
      console.error('Failed to create tag', e);
    }
  };

  const selectExistingTag = (tagId: string) => {
    if (!watchTags.includes(tagId)) setValue('tags', [...watchTags, tagId]);
  };

  const removeTag = (tagId: string) => {
    setValue('tags', watchTags.filter((t) => t !== tagId));
  };

  const onSubmit = (data: NewTaskFormValues) => {
    if (!id) return;
    updateMutation.mutate(
      {
        id,
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          tagIds: data.tags,
          startDate: data.startDate || undefined,
          endDate: data.endDate || undefined,
          colorClass: data.colorClass || undefined,
        },
      },
      { onSuccess: () => navigate('/dashboard') }
    );
  };

  const isPending = updateMutation.isPending;

  // ─── Loading / Error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">refresh</span>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="font-body text-on-surface-variant">No se pudo cargar la tarea.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 rounded-xl bg-primary text-white font-label text-sm"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <h1 className="text-2xl font-semibold tracking-tight font-serif text-indigo-950 hover:opacity-80 transition-opacity">
              Notas Arranca
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen pt-32 pb-16 px-6 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="mb-12 text-center md:text-left">
            <span className="font-label text-xs uppercase tracking-[0.3em] text-secondary mb-3 block">
              Edición de Manuscrito
            </span>
            <h3 className="font-headline text-4xl lg:text-5xl font-black text-primary leading-tight">
              Refinar los detalles de su <span className="italic font-normal">obra maestra</span>.
            </h3>
          </div>

          <div className="glass-card rounded-xl p-8 lg:p-12 shadow-[24px_40px_80px_-20px_rgba(28,27,31,0.06)] border border-outline-variant/15 bg-surface-bright/70 backdrop-blur-md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

              {/* Error Alert */}
              {updateMutation.isError && (
                <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20 font-label text-sm">
                  Ocurrió un error al actualizar la tarea. Por favor, inténtelo nuevamente.
                </div>
              )}

              {/* Título */}
              <div className="space-y-2">
                <label className="font-headline text-lg text-primary block" htmlFor="task-title">
                  Título de la Tarea <span className="text-error">*</span>
                </label>
                <input
                  {...register('title')}
                  disabled={isPending}
                  id="task-title"
                  className={`w-full bg-surface-container-low border-none focus:ring-0 focus:bg-surface-container-lowest text-xl font-headline py-4 px-0 border-b-2 transition-all placeholder:text-outline-variant/60 ${
                    errors.title ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-secondary'
                  }`}
                  placeholder="Ej. Revisión trimestral de curatoría"
                  type="text"
                />
                {errors.title && (
                  <p className="text-error text-xs font-label mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="font-headline text-lg text-primary block" htmlFor="task-desc">
                  Descripción Detallada
                </label>
                <textarea
                  {...register('description')}
                  disabled={isPending}
                  id="task-desc"
                  className="w-full bg-surface-container-low border-none focus:ring-0 focus:bg-surface-container-lowest text-base font-body py-4 px-4 rounded-xl border-l-4 border-outline-variant/30 focus:border-secondary transition-all resize-none"
                  placeholder="Escriba aquí los detalles de esta asignación..."
                  rows={4}
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block" htmlFor="start-date">
                    Fecha de Inicio
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none">
                      calendar_today
                    </span>
                    <input
                      {...register('startDate')}
                      disabled={isPending}
                      id="start-date"
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl font-label text-sm focus:bg-surface-container-lowest transition-all"
                      type="date"
                      max={watchEndDate || undefined}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block" htmlFor="end-date">
                    Fecha de Finalización
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none">
                      event_available
                    </span>
                    <input
                      {...register('endDate')}
                      disabled={isPending}
                      id="end-date"
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl font-label text-sm focus:bg-surface-container-lowest transition-all"
                      type="date"
                      min={watchStartDate || undefined}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="text-error text-xs font-label mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Prioridad */}
              <div className="space-y-4">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Prioridad
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-4">
                      {PRIORITIES.map((p) => {
                        const isSelected = field.value === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            disabled={isPending}
                            onClick={() => field.onChange(p.value)}
                            className={`px-6 py-2 rounded-full border-2 font-headline text-sm font-bold transition-all ${
                              isSelected ? p.selectedClass : `border-outline-variant/30 text-on-surface-variant ${p.className}`
                            } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Etiquetas */}
              <div className="space-y-4">
                <label className="font-headline text-lg text-primary block">Etiquetas Inteligentes</label>
                {existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-label text-on-surface-variant/70 self-center mr-2">Disponibles:</span>
                    {existingTags
                      .filter((t) => !watchTags.includes(t.id))
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectExistingTag(t.id)}
                          className="px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full border border-outline-variant/50 text-on-surface hover:bg-surface-container-high transition-colors"
                        >
                          + {t.name}
                        </button>
                      ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 items-center">
                  {watchTags.map((tagId) => {
                    const t = existingTags.find((x) => x.id === tagId);
                    return (
                      <span key={tagId} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-highest text-on-surface-variant font-label text-xs font-medium">
                        #{t ? t.name : '...'}
                        <button type="button" onClick={() => removeTag(tagId)} disabled={isPending} className="text-outline hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    );
                  })}
                  <div className="relative ml-2">
                    <input
                      type="text"
                      disabled={isPending || createTagMutation.isPending}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      className="bg-transparent border-b border-outline-variant text-xs font-label py-1 focus:outline-none focus:border-primary w-32 placeholder:italic disabled:opacity-50"
                      placeholder={createTagMutation.isPending ? 'Creando...' : 'Nueva etiqueta...'}
                    />
                    <button
                      type="button"
                      disabled={isPending || createTagMutation.isPending || !tagInput.trim()}
                      onClick={addTag}
                      className="absolute -right-6 top-1 text-primary disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {createTagMutation.isPending ? 'pending' : 'add'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Clasificación Visual */}
              <div className="space-y-4">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Clasificación Visual
                </label>
                <Controller
                  name="colorClass"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      {COLORS.map((c) => {
                        const isSelected = field.value === c.value;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            disabled={isPending}
                            onClick={() => field.onChange(c.value)}
                            className={`w-10 h-10 rounded-full ${c.bgClass} border-4 transition-transform ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'} ${
                              isSelected ? `border-surface ring-1 ${c.ringClass}` : 'border-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Submit */}
              <div className="pt-8">
                <button
                  type="submit"
                  disabled={isPending}
                  className={`w-full py-5 rounded-xl font-headline text-lg font-bold shadow-xl flex items-center justify-center gap-3 transition-all ${
                    isPending
                      ? 'bg-surface-container text-outline cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-secondary to-secondary-container text-white shadow-secondary/20 hover:shadow-2xl hover:shadow-secondary/30 active:scale-[0.98]'
                  }`}
                >
                  {isPending ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      Guardando Cambios...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};
