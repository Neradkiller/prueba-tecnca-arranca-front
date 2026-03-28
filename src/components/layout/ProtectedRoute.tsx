import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

// Interface modeled exactly after Swagger docs /auth/me for Notes App
interface User {
  id: string;
  email: string;
  name?: string;
}

const fetchMe = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
};

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false, // Don't retry on 401s
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <span className="font-serif text-primary text-xl tracking-tight">Cargando perfil...</span>
      </div>
    );
  }

  // If there's an error (e.g., 401 interceptor triggered) or no user, redirect
  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
