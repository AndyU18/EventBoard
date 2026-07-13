import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
    reset: resetReg,
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/users', { ...data, role: 'USER' });
      const loginRes = await api.post('/auth/login', { email: data.email, password: data.password });
      login(loginRes.data.access_token, loginRes.data.user);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-extrabold text-2xl bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            EventBoard
          </h1>
          <p className="text-xs text-slate-400 mt-1">Monitoreo de Eventos en Tiempo Real</p>
        </div>

        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
              resetReg();
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${
              isLogin ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
              resetLogin();
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${
              !isLogin ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Registrarse
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl mb-4 font-medium animate-fade-in">
            {errorMsg}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                placeholder="nombre@correo.com"
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...loginRegister('email')}
              />
              {loginErrors.email && (
                <p className="text-[10px] text-rose-400 mt-1 font-medium">{loginErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-10"
                  {...loginRegister('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-[10px] text-rose-400 mt-1 font-medium">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Acceder'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegSubmit(onRegister)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre Completo</label>
              <input
                type="text"
                placeholder="Juan Pérez"
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...regRegister('name')}
              />
              {regErrors.name && (
                <p className="text-[10px] text-rose-400 mt-1 font-medium">{regErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                placeholder="nombre@correo.com"
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...regRegister('email')}
              />
              {regErrors.email && (
                <p className="text-[10px] text-rose-400 mt-1 font-medium">{regErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-10"
                  {...regRegister('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {regErrors.password && (
                <p className="text-[10px] text-rose-400 mt-1 font-medium">{regErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear Cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
