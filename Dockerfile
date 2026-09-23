# Pre-built dist is committed to the repo (built locally because the VPS
# cannot reach Cloudflare-fronted CDNs that the JS toolchain needs).
FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
