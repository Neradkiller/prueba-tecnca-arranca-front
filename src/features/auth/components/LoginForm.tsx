import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useLoginMutation } from '../api/auth.api';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 md:p-12 overflow-hidden bg-surface font-body text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">
      <section className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-bold italic text-primary">Notas Arranca Capital</h1>
        </div>

        <div className="mb-10 text-center">
          <h3 className="font-headline text-4xl text-on-surface tracking-tight mb-2">Bienvenido de Nuevo</h3>
          <p className="text-on-surface-variant font-body">Inicia sesión para acceder a tus notas</p>
        </div>

        {/* Error State */}
        {loginMutation.isError && (
          <div className="mb-8 p-4 bg-error-container text-white rounded-xl flex items-center gap-3 editorial-shadow">
            <span className="material-symbols-outlined text-white">report</span>
            <p className="font-label text-sm font-medium">Credenciales Incorrectas. Por favor, verifique su Contraseña.</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <label htmlFor="email" className="font-label text-[11px] font-semibold uppercase tracking-widest text-outline pl-1 block">
                    Correo Electrónico
                  </label>
                  <FormControl>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        placeholder="curator@alexandria.edu"
                        className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary rounded-xl py-4 px-5 text-on-surface placeholder:text-outline-variant font-body transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-error font-label text-xs pl-1" />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label htmlFor="password" className="font-label text-[11px] font-semibold uppercase tracking-widest text-outline">
                      Contraseña
                    </label>
                    <a href="#" className="font-label text-[11px] text-secondary hover:text-primary transition-colors">
                      Recuperar Acceso
                    </a>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary rounded-xl py-4 px-5 text-on-surface placeholder:text-outline-variant font-body transition-all"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-outline transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-error font-label text-xs pl-1" />
                </FormItem>
              )}
            />

            <div className="pt-4 flex flex-col gap-6">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-[#ffffff] py-4 rounded-xl font-headline font-bold text-lg tracking-wide editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>

              <Link
                to="/register"
                className="w-full text-center py-3 border border-outline-variant/30 rounded-xl font-body text-secondary hover:bg-surface-container-low transition-colors group flex items-center justify-center"
              >
                Crear una Cuenta
                <span className="material-symbols-outlined align-middle ml-1 text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </form>
        </Form>

        <footer className="mt-20 text-center">
        </footer>
      </section>

      {/* Asymmetrical Decorative Ornament */}
      <div className="fixed bottom-[-100px] right-[-100px] w-96 h-96 bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </main>
  );
};
