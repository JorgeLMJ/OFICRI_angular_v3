# Etapa 1: Construir la aplicación Angular
FROM node:18 AS build

WORKDIR /app

# Copiar dependencias
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copiar código fuente y construir
COPY . .
RUN npm run build --prod

# Etapa 2: Servir los archivos con nginx
FROM nginx:alpine

# Copiar archivos compilados al directorio raíz del servidor web
COPY --from=build /app/dist/auth/browser /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Exponer puerto
EXPOSE 80

# Mantener el servidor corriendo
CMD ["nginx", "-g", "daemon off;"]