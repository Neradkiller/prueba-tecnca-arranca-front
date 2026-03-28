import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = void;

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: () => {
      // Clear all queries to ensure no previous session data is shown (solves flash of old user data)
      queryClient.clear();
      // Redirect to the dashboard
      navigate('/dashboard', { replace: true });
    },
  });
};

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * Matches the backend CreateUserDto exactly.
 * Note: frontend field `full_name` is transformed to camelCase `fullName`
 * before being sent – see RegisterForm onSubmit for the transformation.
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export type RegisterResponse = void;

export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post('/users/register', data);
  return response.data;
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      // 1. Register the user
      await registerApi(data);
      // 2. Automatically log them in to get the correct session cookie
      await loginApi({ email: data.email, password: data.password });
    },
    onSuccess: () => {
      // Clear all queries to prevent data leaking from a previous session
      queryClient.clear();
      // After successful registration and login, redirect to dashboard
      navigate('/dashboard', { replace: true });
    },
  });
};
