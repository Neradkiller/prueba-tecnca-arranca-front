import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useRegisterMutation } from '../api/auth.api';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'El nombre completo debe tener al menos 2 caracteres')
      .max(100, 'El nombre completo es demasiado largo'),
    email: z.string().email('Debe ser un correo electrónico válido'),
    password: z
      .string()
      .min(12, 'La contraseña debe tener al menos 12 caracteres')
      .max(128, 'La contraseña es demasiado larga'),
    confirm_password: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los Términos de Custodia para continuar',
    }),
  })
  // z.refine: runs AFTER all individual field validations pass.
  // It receives the entire parsed object and checks cross-field constraints.
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    // Attach the error to confirm_password so it shows under that field
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const registerMutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      terms: false,
    },
  });

  /**
   * DATA TRANSFORMATION FLOW:
   *
   * 1. RHF gives us `RegisterFormValues` which contains UI-only fields:
   *    { full_name, email, password, confirm_password, terms }
   *
   * 2. We destructure to isolate fields, renaming `full_name` ➜ `fullName`
   *    to match the backend's CreateUserDto (camelCase).
   *
   * 3. We drop `confirm_password` and `terms` — they are purely frontend
   *    concerns and must NOT be sent to the API.
   *
   * 4. The resulting `RegisterRequest` payload is: { fullName, email, password }
   */
  const onSubmit = (data: RegisterFormValues) => {
    const { full_name, email, password } = data;
    registerMutation.mutate({
      fullName: full_name, // snake_case ➜ camelCase transformation
      email,
      password,
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 md:p-12 overflow-hidden bg-surface font-body text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">
      <section className="w-full max-w-md relative z-10 bg-surface-container-lowest p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-outline-variant/20">
        {/* Branding Header */}
        <div className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-bold italic text-primary">Notas Arranca Capital</h1>
        </div>

        <div className="mb-10 text-center">
          <h2 className="font-headline text-4xl text-on-surface tracking-tight mb-2">
            Comienza tu Registro
          </h2>
        </div>

        {/* Global Error Banner */}
        {registerMutation.isError && (
          <div className="mb-8 p-4 bg-error-container text-white rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-white">report</span>
            <p className="font-label text-sm font-medium">
              {(registerMutation.error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ??
                'Ocurrió un error al crear la cuenta. Por favor, inténtalo de nuevo.'}
            </p>
          </div>
        )}

        {/* Success Banner */}
        {registerMutation.isSuccess && (
          <div className="mb-8 p-4 bg-secondary-container text-white rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-white">check_circle</span>
            <p className="font-label text-sm font-medium">
              ¡Cuenta creada! Redirigiendo al inicio de sesión…
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* ── Full Name ── */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <label
                    htmlFor="full_name"
                    className="font-label text-[11px] font-semibold uppercase tracking-widest text-outline pl-1 block"
                  >
                    Nombre Completo
                  </label>
                  <FormControl>
                    <input
                      id="full_name"
                      type="text"
                      placeholder="Elias Thorne"
                      className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary rounded-xl py-4 px-5 text-on-surface placeholder:text-outline-variant font-body transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-error font-label text-xs pl-1" />
                </FormItem>
              )}
            />

            {/* ── Email ── */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <label
                    htmlFor="email"
                    className="font-label text-[11px] font-semibold uppercase tracking-widest text-outline pl-1 block"
                  >
                    Correo Electrónico
                  </label>
                  <FormControl>
                    <input
                      id="email"
                      type="email"
                      placeholder="curador@notasarranca.edu"
                      className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary rounded-xl py-4 px-5 text-on-surface placeholder:text-outline-variant font-body transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-error font-label text-xs pl-1" />
                </FormItem>
              )}
            />

            {/* ── Password ── */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <label
                    htmlFor="password"
                    className="font-label text-[11px] font-semibold uppercase tracking-widest text-outline pl-1 block"
                  >
                    Contraseña
                  </label>
                  <FormControl>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary rounded-xl py-4 px-5 pr-12 text-on-surface placeholder:text-outline-variant font-body transition-all"
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

            {/* ── Confirm Password ── */}
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <label
                    htmlFor="confirm_password"
                    className="font-label text-[11px] font-semibold uppercase tracking-widest text-outline pl-1 block"
                  >
                    Confirmar Contraseña
                  </label>
                  <FormControl>
                    <div className="relative">
                      <input
                        id="confirm_password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary rounded-xl py-4 px-5 pr-12 text-on-surface placeholder:text-outline-variant font-body transition-all"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-outline transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showConfirm ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-error font-label text-xs pl-1" />
                </FormItem>
              )}
            />

            {/* ── Terms Checkbox ── */}
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-start gap-3 py-1">
                    <FormControl>
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 border-outline-variant data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                      />
                    </FormControl>
                    <label
                      htmlFor="terms"
                      className="font-label text-xs text-on-surface-variant leading-relaxed cursor-pointer"
                    >
                      Acepto los{' '}
                      <a href="#" className="text-secondary hover:underline font-medium">
                        Términos de Custodia
                      </a>{' '}
                      y la{' '}
                      <a href="#" className="text-secondary hover:underline font-medium">
                        Política de Privacidad
                      </a>{' '}
                      del Archivo.
                    </label>
                  </div>
                  <FormMessage className="text-error font-label text-xs pl-1" />
                </FormItem>
              )}
            />

            {/* ── Submit Button ── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-[#ffffff] py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </div>
          </form>
        </Form>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-surface-container text-center">
          <p className="font-label text-sm text-on-surface-variant">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-primary font-bold hover:text-secondary transition-colors ml-1"
            >
              Inicia Sesión
            </Link>
          </p>
        </footer>
      </section>

      {/* Grain noise overlay — matches the stitch design */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-50">
        <svg height="100%" width="100%">
          <filter id="grain">
            <feTurbulence baseFrequency="0.6" numOctaves={3} stitchTiles="stitch" type="fractalNoise" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect filter="url(#grain)" height="100%" width="100%" />
        </svg>
      </div>

      {/* Decorative ambient blobs */}
      <div className="fixed bottom-[-100px] right-[-100px] w-96 h-96 bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
    </main>
  );
};
