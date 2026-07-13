import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Terminal, Send, Sparkles, CheckCircle,
  ShieldAlert
} from 'lucide-react';

const simulatorSchema = z.object({
  type: z.string().min(2, 'El tipo de evento debe tener al menos 2 caracteres'),
  sourceModule: z.string().min(2, 'El módulo de origen debe tener al menos 2 caracteres'),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  payloadStr: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, 'El payload debe ser un JSON válido'),
});

type SimulatorForm = z.infer<typeof simulatorSchema>;

export const Simulator: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SimulatorForm>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: {
      type: 'USER_CREATED',
      sourceModule: 'auth',
      severity: 'INFO',
      payloadStr: JSON.stringify({ email: 'nuevo_usuario@gmail.com', name: 'Carlos Díaz' }, null, 2),
    },
  });

  const onSubmit = async (data: SimulatorForm) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const payload = JSON.parse(data.payloadStr);
      const res = await api.post('/events/publish', {
        type: data.type,
        sourceModule: data.sourceModule,
        severity: data.severity,
        payload,
        userId: user?.id,
      });

      setSuccessMsg(res.data.message);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al publicar el evento');
    } finally {
      setLoading(false);
    }
  };

  const quickSimulations = [
    {
      title: 'Creación de Usuario',
      desc: 'Simula un registro exitoso de un nuevo cliente.',
      type: 'USER_CREATED',
      module: 'auth',
      severity: 'INFO' as const,
      payload: { email: 'maria@gmail.com', name: 'María Gómez', role: 'USER' },
    },
    {
      title: 'Aprobación de Documento',
      desc: 'Cambio de estado administrativo a aprobado.',
      type: 'DOCUMENT_APPROVED',
      module: 'documents',
      severity: 'INFO' as const,
      payload: { documentId: 'doc-4820-2026', approvedBy: 'Admin', title: 'Contrato Anual' },
    },
    {
      title: 'Fallo de CPU (Servidor)',
      desc: 'Alerta crítica sobre capacidad de cómputo.',
      type: 'SYSTEM_ALERT_CRITICAL',
      module: 'system',
      severity: 'CRITICAL' as const,
      payload: { server: 'prod-server-02', usageCpu: '98%', temperature: '92°C' },
    },
    {
      title: 'Pago Recibido',
      desc: 'Transacción financiera exitosa procesada.',
      type: 'PAYMENT_RECEIVED',
      module: 'payments',
      severity: 'INFO' as const,
      payload: { invoiceId: 'inv_10284', amount: 350.0, method: 'Credit Card' },
    },
    {
      title: 'Intento de Intrusión',
      desc: 'Advertencia sobre intentos fallidos de Login.',
      type: 'SECURITY_ALERT_LOGIN',
      module: 'auth',
      severity: 'WARNING' as const,
      payload: { attemptsCount: 5, ipAddress: '192.168.1.150', email: 'hack_attempt@target.com' },
    },
    {
      title: 'Reporte de Incidente',
      desc: 'Apertura de un ticket de soporte crítico.',
      type: 'INCIDENT_REPORTED',
      module: 'tasks',
      severity: 'WARNING' as const,
      payload: { ticketId: 'tkt-857', severity: 'HIGH', issue: 'Base de datos lenta' },
    },
  ];

  const triggerQuickSim = (sim: typeof quickSimulations[0]) => {
    setValue('type', sim.type);
    setValue('sourceModule', sim.module);
    setValue('severity', sim.severity);
    setValue('payloadStr', JSON.stringify(sim.payload, null, 2));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
          Simulador de Eventos (Event Producer)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Publica eventos personalizados directamente en el bus para ver cómo se procesan y distribuyen en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-6">
            <Terminal className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200">Publicar Evento Personalizado</h3>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl mb-4 font-medium animate-fade-in flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl mb-4 font-medium animate-fade-in flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Evento</label>
                <input
                  type="text"
                  placeholder="USER_CREATED"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono uppercase"
                  {...register('type')}
                />
                {errors.type && <p className="text-[10px] text-rose-455 mt-1 font-medium">{errors.type.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Módulo de Origen</label>
                <input
                  type="text"
                  placeholder="auth"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  {...register('sourceModule')}
                />
                {errors.sourceModule && <p className="text-[10px] text-rose-455 mt-1 font-medium">{errors.sourceModule.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Severidad</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-semibold"
                  {...register('severity')}
                >
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Payload (JSON)</label>
              <textarea
                rows={6}
                placeholder="{}"
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                {...register('payloadStr')}
              />
              {errors.payloadStr && <p className="text-[10px] text-rose-455 mt-1 font-medium">{errors.payloadStr.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all text-xs flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-500/10"
            >
              <Send className="h-4 w-4" />
              Publicar Mensaje en RabbitMQ
            </button>
          </form>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-6">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-200">Simulación Rápida</h3>
          </div>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Haz clic en cualquiera de las siguientes plantillas para cargar automáticamente un caso de simulación predefinido y realista.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {quickSimulations.map((sim, i) => {
              return (
                <button
                  key={i}
                  onClick={() => triggerQuickSim(sim)}
                  className="w-full text-left p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-slate-700/80 hover:bg-slate-900/40 transition-all duration-200 group flex items-start gap-3"
                >
                  <div className="h-2 w-2 rounded-full shrink-0 mt-1.5 bg-current" style={{ color: sim.severity === 'CRITICAL' ? '#f43f5e' : sim.severity === 'WARNING' ? '#f59e0b' : '#6366f1' }} />
                  <div>
                    <h4 className="font-bold text-xs text-slate-300 group-hover:text-slate-100 transition-colors">
                      {sim.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{sim.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
