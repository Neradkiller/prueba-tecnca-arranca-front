import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** API enum: 'low' | 'medium' | 'high' | 'urgent' */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  /** true = completed */
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface GetTasksParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 10, max: 100) */
  limit?: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
  colorClass?: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

// ─── API Function ─────────────────────────────────────────────────────────────

/**
 * Fetches all tasks for the authenticated user.
 * The global Axios interceptor automatically attaches the HttpOnly cookie.
 * If the server responds with 401, the interceptor redirects to /login.
 */
export interface PaginatedTasksResponse {
  data: Task[];
  meta: {
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export const getTasksApi = async (params?: GetTasksParams): Promise<Task[]> => {
  const response = await apiClient.get<PaginatedTasksResponse>('/tasks', { params });
  return response.data.data;
};

export const getPaginatedTasksApi = async (params: GetTasksParams): Promise<PaginatedTasksResponse> => {
  const response = await apiClient.get<PaginatedTasksResponse>('/tasks', { params });
  return response.data;
};

export const createTaskApi = async (data: CreateTaskRequest): Promise<Task> => {
  const response = await apiClient.post<Task>('/tasks', data);
  return response.data;
};

export const updateTaskApi = async ({ id, data }: { id: string; data: Partial<CreateTaskRequest> & { completed?: boolean } }): Promise<Task> => {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTaskApi = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};

export const getTaskByIdApi = async (id: string): Promise<Task> => {
  const response = await apiClient.get<Task>(`/tasks/${id}`);
  return response.data;
};

export const getTagsApi = async (): Promise<Tag[]> => {
  const response = await apiClient.get<Tag[]>('/tags');
  return response.data;
};

export const createTagApi = async (data: CreateTagRequest): Promise<Tag> => {
  const response = await apiClient.post<Tag>('/tags', data);
  return response.data;
};

// ─── Query Hook ───────────────────────────────────────────────────────────────

/**
 * TanStack Query hook for fetching tasks.
 *
 * 📡 Data Flow & 401 interception:
 * 1. On mount, this hook calls getTasksApi.
 * 2. apiClient sends the GET /tasks request with the HttpOnly cookie
 *    (because `withCredentials: true` is set on the axios instance).
 * 3. If the session is expired, the backend returns 401 Unauthorized.
 * 4. The global response interceptor in src/lib/axios.ts catches the 401
 *    and immediately calls `window.location.href = '/login'`, resetting the app.
 * 5. TanStack Query never resolves/rejects – the user is redirected transparently.
 */
export const useTasksQuery = (params?: GetTasksParams) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => getTasksApi(params),
    retry: 1,
  });
};

const PAGE_LIMIT = 20;

export const useInfiniteTasksQuery = () => {
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      getPaginatedTasksApi({ page: pageParam as number, limit: PAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    retry: 1,
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskApi,
    onSuccess: async () => {
      // Invalidate the tasks query so Dashboard automatically fetches the fresh data
      // We await it so that any dependent UI navigations effectively get the new data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useTagsQuery = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTagsApi,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTagApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaskApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useToggleCompleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTaskApi({ id, data: { completed } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useTaskByIdQuery = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getTaskByIdApi(id),
    enabled: !!id,
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskRequest> }) =>
      updateTaskApi({ id, data }),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};
