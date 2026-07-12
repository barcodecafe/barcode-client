# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# .npmrc (legacy-peer-deps) + package.json first for better layer caching.
# No package-lock.json is committed (a Windows lockfile breaks Linux native
# binaries), so we use `npm install`.
COPY package.json .npmrc ./
RUN npm install

# VITE_API_BASE_URL is baked into the bundle at BUILD time. Coolify passes
# env vars marked as "Build Variable" as --build-arg, so keep it a Build Variable.
# The default is just a fallback; the build arg overrides it.
ARG VITE_API_BASE_URL="https://wef407vl1aqzgq4uz3pqy8xl.151.158.101.246.sslip.io/api"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
# Replace the default nginx site with our SPA-aware config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
