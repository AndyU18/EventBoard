# Plan de Implementación - EventBoard

Este documento detalla la planificación paso a paso para el desarrollo de **EventBoard**, un sistema de monitoreo de eventos en tiempo real con Arquitectura Orientada a Eventos (EDA).

---

## 📋 Resumen del Proyecto
EventBoard centraliza las acciones clave de una organización (registro de usuarios, cambios de estado de documentos, alertas, etc.) en un bus de eventos, los procesa mediante colas de mensajería (RabbitMQ) y los muestra en un dashboard interactivo en tiempo real.

---

## 🛠️ Stack Tecnológico
*   **Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL, RabbitMQ, Socket.IO, JWT, bcrypt, class-validator, Swagger.
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, React Router DOM, Zustand (estado global), TanStack Query (fetching), TanStack Table (tablas avanzadas), React Hook Form + Zod (formularios y validación), Recharts (gráficos), Socket.IO Client, Axios.
*   **Despliegue/Entorno:** Ejecución 100% local (sin Docker), base de datos en PostgreSQL local y RabbitMQ a través de un servicio Cloud gratuito (CloudAMQP) o instalación local de RabbitMQ en Windows.

---

## 🗺️ Mapa de Ruta de Implementación (Fases)

### Fase 1: Estructura del Repositorio e Inicialización
*   [ ] **1.1. Estructura de Carpetas:** Configurar el repositorio para separar el backend y el frontend de forma ordenada.
    ```text
    EventBoard/
    ├── backend/      # Código de NestJS
    ├── frontend/     # Código de React (Vite)
    ├── PLAN.md       # Este plan de trabajo
    └── AGENTS.md     # Guía para agentes de IA
    ```
*   [ ] **1.2. Inicialización del Backend:** Crear el proyecto NestJS en `backend/` usando `nest new backend`.
*   [ ] **1.3. Inicialización del Frontend:** Crear el proyecto React con TypeScript y Vite en `frontend/` usando `npm create vite@latest frontend -- --template react-ts`.
*   [ ] **1.4. Repositorio Git:** Verificar los archivos `.gitignore` en ambas carpetas y asegurar la estructura base.

---

### Fase 2: Configuración de Base de Datos y Prisma (Backend)
*   [ ] **2.1. Instalación de Prisma:** Instalar Prisma CLI y el cliente de Prisma en el backend.
*   [ ] **2.2. Diseño del Schema (`schema.prisma`):**
    *   **User:** ID, email, password (hashed), name, role (ADMIN, PRODUCER, CONSUMER), createdAt.
    *   **EventLog (Event Store):** ID, type (string, ej: `USER_CREATED`, `DOCUMENT_APPROVED`), sourceModule (string, ej: `auth`, `documents`), payload (JSON, detalles del evento), userId (opcional, quién causó el evento), severity (INFO, WARNING, CRITICAL), createdAt.
    *   **Notification:** ID, recipient, message, status (SENT, FAILED), eventLogId, createdAt.
    *   **SystemStats:** Historial acumulado para analíticas rápidas (opcional, o derivar con queries en Prisma/PostgreSQL).
*   [ ] **2.3. Migraciones y Conexión Local:** Configurar `.env` con la base de datos PostgreSQL local y correr `npx prisma migrate dev --name init`.

---

### Fase 3: Autenticación, Usuarios y Swagger (Backend)
*   [ ] **3.1. Módulo de Usuarios:** Crear endpoints para registrar y listar usuarios.
*   [ ] **3.2. Módulo de Autenticación:**
    *   Implementar JWT + Passport para proteger las rutas.
    *   Configurar guards basados en roles (Admin para configurar, Producer para enviar eventos, etc.).
*   [ ] **3.3. Configuración de Swagger:** Integrar `@nestjs/swagger` para documentar la API y probar las peticiones directamente desde el navegador.

---

### Fase 4: Cola de Mensajes (RabbitMQ) e Integración
*   [ ] **4.1. Proveedor de RabbitMQ (Servicio Gratuito u Local):**
    *   *Opción Recomendada (Sin Instalación):* Crear una cuenta gratuita en **CloudAMQP** (Plan Little Lemur - $0 USD) y obtener la URL de conexión `amqp://...`
    *   *Opción Local:* Instalar Erlang y RabbitMQ en Windows y levantar el servicio en `localhost:5672`.
*   [ ] **4.2. Módulo de RabbitMQ en NestJS:**
    *   Implementar un módulo de mensajería (usando `@nestjs/microservices` o `@golevelup/nestjs-rabbitmq`).
    *   Configurar intercambio (Exchange, tipo *topic* o *fanout*) y colas (`event-store-queue`, `notifications-queue`, `analytics-queue`).
*   [ ] **4.3. Fallback en Memoria:** Crear un mecanismo de fallback (Event Emitter local) si no hay una conexión activa a RabbitMQ, facilitando el desarrollo rápido sin dependencias externas obligatorias.

---

### Fase 5: Productores, Consumidores y Lógica de Eventos (Backend)
*   [ ] **5.1. Productor de Eventos (API):**
    *   Crear un endpoint público/protegido `/events/publish` que permita simular y publicar cualquier evento en el bus (RabbitMQ).
    *   Publicar eventos automáticamente en acciones del sistema (ej: cuando un usuario nuevo se registra, emitir `USER_REGISTERED`).
*   [ ] **5.2. Consumidor: Event Store:**
    *   Escuchar todos los eventos e insertarlos en la base de datos PostgreSQL usando Prisma (histórico de auditoría).
*   [ ] **5.3. Consumidor: Notifications Service:**
    *   Escuchar eventos y, si cumplen ciertas reglas (ej: severidad `CRITICAL` o tipo `ALERT`), generar un registro en la tabla `Notification`.
*   [ ] **5.4. Consumidor: Real-time Broadcaster:**
    *   Escuchar eventos y reenviarlos al gateway de WebSockets para su difusión inmediata.

---

### Fase 6: Servidor de WebSockets (Socket.IO - Backend)
*   [ ] **6.1. Gateway de Socket.IO en NestJS:**
    *   Configurar un WebSockets Gateway para Socket.IO.
    *   Implementar autenticación de sockets con JWT (opcional pero recomendado).
*   [ ] **6.2. Emisión en Tiempo Real:**
    *   Cuando el consumidor del bus reciba un evento, emitir a través de Socket.IO un mensaje a todos los clientes conectados en la sala correspondiente.

---

### Fase 7: Estructura del Frontend, Tailwind y Zustand (Frontend)
*   [ ] **7.1. Estructura y Configuración:**
    *   Instalar Tailwind CSS en Vite.
    *   Configurar Router DOM para la navegación (`/login`, `/dashboard`, `/events`, `/simulador`).
*   [ ] **7.2. Cliente de Socket.IO:**
    *   Crear un servicio/contexto en React para conectarse al Socket.IO del Backend.
*   [ ] **7.3. Tienda de Estado con Zustand:**
    *   Crear `useAuthStore` (usuario logueado, token).
    *   Crear `useEventStore` (lista de eventos en tiempo real recibidos por WebSockets, contador de notificaciones).
*   [ ] **7.4. UI Core & Temas:**
    *   Definir una paleta de colores premium en Tailwind (Gris Oscuro/Slate, Acentos en Violeta/Indigo, Alertas en Esmeralda y Crimson).
    *   Implementar componentes básicos comunes (Botones, Inputs, Modales, Alertas con animaciones micro).

---

### Fase 8: Páginas y Dashboard (Frontend)
*   [ ] **8.1. Página de Login/Registro:** Formularios validados con React Hook Form + Zod, consumo de API con Axios.
*   [ ] **8.2. Dashboard Principal:**
    *   Mostrar métricas clave: Total de eventos hoy, eventos por severidad (INFO, WARN, CRITICAL).
    *   Gráficos en tiempo real con Recharts (ej: eventos recibidos por minuto, distribución por módulos).
    *   Feed de últimos eventos con animaciones de entrada.
*   [ ] **8.3. Historial de Eventos (Event Store):**
    *   Listado completo con paginación, filtros por fecha, tipo, severidad y módulo usando TanStack Table.
*   [ ] **8.4. Simulador de Eventos (Producer Mock):**
    *   Una interfaz interactiva para "disparar" eventos de prueba (ej. simular "DOCUMENT_APPROVED", "SYSTEM_ALERT" con payloads personalizados) y ver cómo reacciona el dashboard en vivo.

---

### Fase 9: Pulido, Swagger y Documentación
*   [ ] **9.1. Manejo de Errores y Robustez:**
    *   Asegurar que si RabbitMQ se desconecta, el sistema no se caiga (graceful degradation con logs claros).
*   [ ] **9.2. Documentación Final:**
    *   Actualizar el README con la configuración de variables de entorno y pasos detallados.
*   [ ] **9.3. Pruebas de Flujo Completo:**
    *   Verificar que un evento disparado en el simulador frontend viaje al backend, se publique en RabbitMQ, sea consumido, se guarde en PostgreSQL, se envíe por Socket.IO, y se dibuje en el Dashboard sin necesidad de recargar.

---

## 📈 Criterios de Aceptación Académicos (Checklist)
1.  **Bajo Acoplamiento:** Los módulos productores no llaman directamente a los consumidores. Si se apaga el módulo de notificaciones, el sistema sigue guardando eventos.
2.  **Tiempo Real Real:** Los eventos aparecen en el dashboard al instante (latencia menor a 200ms tras ser consumidos de la cola).
3.  **Seguridad:** Endpoints de administración protegidos por JWT.
4.  **Calidad Visual:** Dashboard moderno, responsivo, con animaciones fluidas y gráficos legibles.
5.  **Sin Docker:** Todo debe poder correr instalando dependencias de Node.js, configurando variables de entorno `.env` y levantando los servicios con comandos locales simples (`npm run start:dev` y `npm run dev`).
