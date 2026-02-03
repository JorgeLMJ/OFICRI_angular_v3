# Etapa 1: Construir la aplicación Angular
FROM node:18 AS build

WORKDIR /app

# Copiar dependencias y evitar errores de compatibilidad
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar código fuente y compilar
COPY . .
RUN npm run build --configuration=production

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# ✅ CORREGIDO: Se usa 'web_tramites' que es el nombre real de tu proyecto
# Se usa la ruta dist/web_tramites/browser que es el estándar de Angular 17+
COPY --from=build /app/dist/web_tramites/browser /usr/share/nginx/html

# Copiar tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]