import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useEventStore } from '../store/useEventStore';
import { useSocket } from '../hooks/useSocket';
import { getSocket } from '../services/socket';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, Info, AlertTriangle, ShieldAlert,
  Clock, Box
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  useSocket();

  const realTimeEvents = useEventStore((state) => state.events);
  const setEvents = useEventStore((state) => state.setEvents);
  const clearEvents = useEventStore((state) => state.clearAll);

  const [selectedRoom, setSelectedRoom] = React.useState('room:all');

  useQuery({
    queryKey: ['initial-events'],
    queryFn: async () => {
      const res = await api.get('/event-store');
      setEvents(res.data.slice(0, 50));
      return res.data;
    },
  });

  const { data: stats = { total: 0, severities: [], modules: [] } } = useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => {
      const res = await api.get('/event-store/stats');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const handleRoomChange = (room: string) => {
    setSelectedRoom(room);
    clearEvents();
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('subscribe_to_room', room);
    }
  };

  const severityData = [
    { name: 'INFO', value: stats.severities.find((s: any) => s.severity === 'INFO')?._count || 0, color: '#6366f1' },
    { name: 'WARNING', value: stats.severities.find((s: any) => s.severity === 'WARNING')?._count || 0, color: '#f59e0b' },
    { name: 'CRITICAL', value: stats.severities.find((s: any) => s.severity === 'CRITICAL')?._count || 0, color: '#f43f5e' },
  ].filter(item => item.value > 0);

  const moduleData = stats.modules.map((m: any) => ({
    name: m.sourceModule,
    Eventos: m._count,
  }));

  const totalCount = stats.total;
  const infoCount = stats.severities.find((s: any) => s.severity === 'INFO')?._count || 0;
  const warningCount = stats.severities.find((s: any) => s.severity === 'WARNING')?._count || 0;
  const criticalCount = stats.severities.find((s: any) => s.severity === 'CRITICAL')?._count || 0;

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
          Panel de Monitoreo
        </h2>
        <p className="text-sm text-slate-400 mt-1">Monitorea la actividad del bus de eventos y la salud del sistema en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Eventos</p>
            <h3 className="text-3xl font-extrabold text-white">{totalCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Info</p>
            <h3 className="text-3xl font-extrabold text-white">{infoCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
            <Info className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Advertencias</p>
            <h3 className="text-3xl font-extrabold text-white">{warningCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas Críticas</p>
            <h3 className="text-3xl font-extrabold text-white">{criticalCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-200">Distribución de Eventos por Módulo</h4>
            <p className="text-xs text-slate-500">Muestra la carga de eventos en cada módulo del sistema.</p>
          </div>
          <div className="h-64">
            {moduleData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Esperando eventos en la cola...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Eventos" fill="url(#moduleGrad)" radius={[6, 6, 0, 0]}>
                    <defs>
                      <linearGradient id="moduleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-200">Severidad de Eventos</h4>
            <p className="text-xs text-slate-500">Distribución porcentual de los tipos de riesgo.</p>
          </div>
          <div className="h-48 flex items-center justify-center relative">
            {severityData.length === 0 ? (
              <div className="text-xs text-slate-500">No hay datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Severidades</span>
              <span className="text-lg font-extrabold text-slate-200">{severityData.length} Tipos</span>
            </div>
          </div>
          <div className="flex justify-around text-xs mt-2">
            {severityData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/20 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400 animate-pulse" />
              Feed de Eventos en Tiempo Real
            </h3>
            <p className="text-xs text-slate-500">Eventos consumidos de RabbitMQ ingresando en vivo al sistema.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs text-slate-400 font-semibold shrink-0">Canal en Vivo:</label>
            <select
              value={selectedRoom}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
            >
              <option value="room:all">Todos los Eventos</option>
              <option value="room:critical">Solo Críticos (CRITICAL)</option>
              <option value="room:warning-critical">Críticos & Advertencias</option>
              <option value="room:auth">Módulo Auth</option>
              <option value="room:documents">Módulo Documents</option>
              <option value="room:tasks">Módulo Tasks</option>
              <option value="room:payments">Módulo Payments</option>
              <option value="room:system">Módulo System</option>
            </select>
            
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Activo
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {realTimeEvents.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Esperando eventos en esta sala...
            </div>
          ) : (
            realTimeEvents.slice(0, 10).map((event) => {
              let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700/60';
              if (event.severity === 'WARNING') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              if (event.severity === 'CRITICAL') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              // @ts-ignore
              const isReplay = event.isReplay;

              return (
                <div 
                  key={event.id} 
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-xl hover:border-slate-700/80 transition-all duration-200 hover:bg-slate-900/60 animate-fade-in ${
                    isReplay ? 'bg-purple-950/10 border-purple-500/20' : 'bg-slate-900/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      event.severity === 'CRITICAL' ? 'bg-rose-500' : event.severity === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'
                    } mt-2 md:mt-0`} />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-200">{event.type}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${badgeColor}`}>
                          {event.severity}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Box className="h-3 w-3" />
                          {event.sourceModule}
                        </span>
                        {isReplay && (
                          <span className="text-[9px] px-2.5 py-0.5 rounded-full border bg-purple-500/20 text-purple-400 border-purple-500/30 font-bold uppercase tracking-wider animate-pulse">
                            Replay
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-450 mt-1 font-medium">
                        Payload: <code className="text-slate-350 bg-slate-950/40 px-1 py-0.5 rounded text-[10px]">{JSON.stringify(event.payload)}</code>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center md:flex-col gap-2 md:gap-0 justify-between md:justify-center border-t border-slate-800 md:border-none pt-2 md:pt-0">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-slate-550" />
                      {formatTime(event.createdAt)}
                    </span>
                    {event.user?.name && (
                      <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 mt-0.5">
                        By {event.user.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
