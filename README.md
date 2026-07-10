# 📊 EventBoard

EventBoard es un centro de monitoreo de eventos en tiempo real desarrollado bajo una **Arquitectura Orientada a Eventos (Event-Driven Architecture - EDA)**. Este proyecto académico demuestra el uso de comunicación asíncrona mediante un bus de eventos, persistencia en base de datos relacional y propagación de eventos en tiempo real a una interfaz web interactiva de alto impacto visual.

---

## 🛠️ Stack Tecnológico

### Backend
*   **NestJS** (Framework principal)
*   **TypeScript** (Lenguaje de programación)
*   **Prisma ORM** (Acceso a base de datos)
*   **PostgreSQL** (Persistencia de logs e información de usuarios)
*   **RabbitMQ** (Message Broker / Bus de Eventos)
*   **Socket.IO** (Comunicación bidireccional en tiempo real con el cliente)
*   **JWT & bcrypt** (Autenticación y seguridad de contraseñas)
*   **Swagger** (Documentación interactiva de la API)

### Frontend
*   **React** + **Vite** (Entorno de desarrollo rápido)
*   **TypeScript** (Soporte de tipado estático)
*   **Tailwind CSS** (Estilos premium y responsivos)
*   **Zustand** (Manejador de estado ligero y veloz)
*   **TanStack Query** (Manejo eficiente de peticiones y caché de API)
*   **TanStack Table** (Tablas interactivas con ordenamiento y filtrado)
*   **Recharts** (Visualización gráfica de estadísticas de eventos en tiempo real)
*   **Socket.IO Client** (Conexión al canal de WebSockets)

---

## ⚙️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu máquina local:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
*   **PostgreSQL** junto con **pgAdmin** (instalado localmente).

---

## 🚀 Guía de Configuración e Inicio (Local, Sin Docker)

Sigue estos sencillos pasos para poner en marcha el proyecto en tu entorno local.

### Paso 1: Configurar la Base de Datos en pgAdmin
1. Abre **pgAdmin** y conéctate a tu servidor local de PostgreSQL.
2. Haz clic derecho en **Databases** y selecciona **Create > Database...**
3. Nombra la base de datos como `eventboard` y haz clic en **Save**.

### Paso 2: Obtener un Bus de Eventos (RabbitMQ)
Tienes tres opciones para esto:

*   **Opción A (Recomendada y Gratuita - Sin instalar nada):**
    1. Regístrate gratis en [CloudAMQP](https://www.cloudamqp.com/).
    2. Crea una nueva instancia (selecciona el plan gratuito **Little Lemur** y la región de tu preferencia).
    3. Una vez creada, ve al panel de control de la instancia y copia la **AMQP URL** (empieza por `amqps://...`). La usarás en el archivo `.env` del backend.
*   **Opción B (Instalación local en Windows):**
    1. Descarga e instala [Erlang/OTP](https://www.erlang.org/downloads) (requisito para RabbitMQ).
    2. Descarga e instala el instalador oficial de [RabbitMQ Server para Windows](https://www.rabbitmq.com/install-windows.html).
    3. Una vez instalado, el servicio de RabbitMQ se ejecutará automáticamente en `amqp://localhost:5672`.
*   **Opción C (Modo de Desarrollo sin RabbitMQ):**
    *   *¿No quieres configurar colas de mensajería hoy?* El backend de EventBoard incluye un **mecanismo de fallback en memoria**. Si no configuras la URL de RabbitMQ, el sistema utilizará un bus local interno de NestJS para que puedas probar el flujo completo sin dependencias externas.

---

### Paso 3: Configurar y Correr el Backend (NestJS)

1. Abre una terminal en la raíz del proyecto y entra a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz de la carpeta `backend` basándote en `.env.example` (o créalo con los siguientes valores):
   ```env
   PORT=3000
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/eventboard?schema=public"
   # Sustituye 'usuario' y 'contraseña' por tus credenciales de PostgreSQL local.
   
   RABBITMQ_URL="amqp://localhost:5672" 
   # Cambia esta URL si usas CloudAMQP (ej: amqps://...) o déjala vacía para activar el fallback en memoria.

   JWT_SECRET="mi_secreto_super_seguro_academic_project"
   ```
4. Genera el cliente de Prisma y ejecuta las migraciones para crear las tablas automáticamente:
   ```bash
   npx prisma migrate dev --name init
   ```
5. *(Opcional)* Si existe un script de seed para poblar datos de prueba (usuarios de prueba, etc.), ejecútalo:
   ```bash
   npx prisma db seed
   ```
6. Inicia el servidor en modo desarrollo:
   ```bash
   npm run start:dev
   ```
   *El backend estará corriendo en [http://localhost:3000](http://localhost:3000).*
   *Puedes consultar la documentación interactiva de Swagger en [http://localhost:3000/api](http://localhost:3000/api).*

---

### Paso 4: Configurar y Correr el Frontend (React)

1. Abre una nueva terminal en la raíz del proyecto y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz de la carpeta `frontend`:
   ```env
   VITE_API_URL="http://localhost:3000"
   ```
4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *El frontend estará listo en [http://localhost:5173](http://localhost:5173) (o la URL que indique la consola).*

---

## 🔍 Flujo de Prueba Rápido

Para validar que todo el sistema EDA y tiempo real está funcionando correctamente:
1. Abre el **Frontend** en tu navegador.
2. Inicia sesión o regístrate con un nuevo usuario.
3. Dirígete a la sección del **Simulador de Eventos** (Producer Mock).
4. Elige un tipo de evento (ej: `REQUEST_CREATED` o `SYSTEM_ALERT_CRITICAL`) y haz clic en **Enviar Evento**.
5. Ve a la pestaña **Dashboard** (en tiempo real): verás reflejado el evento instantáneamente en los gráficos, contadores y en la lista de eventos en vivo sin necesidad de refrescar la página.
6. Verifica en **pgAdmin** que en la tabla `event_logs` se haya guardado el historial del evento enviado.

---

## 📈 Visualización del Flujo Completo
1. **Simulación:** La interfaz del Frontend envía un evento al endpoint `/events/publish` en el Backend.
2. **Publicación:** El Backend recibe el evento y lo publica en la cola de **RabbitMQ**.
3. **Consumo:** Los consumidores suscritos procesan la cola:
    *   Un consumidor registra el evento en **PostgreSQL** mediante **Prisma**.
    *   Otro consumidor detecta si requiere emitir una alerta / notificación.
    *   Un consumidor de WebSockets toma el evento y lo envía al Gateway de **Socket.IO**.
4. **Actualización:** El cliente web recibe el evento en tiempo real y actualiza el Dashboard visual.
