# builder
FROM node:24.22.3-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test && npm run build


# runner
# Official nginx image (security releases land the same day), run fully as
# the unprivileged nginx user like nginxinc/nginx-unprivileged: no `user`
# directive, PID and temp files in /tmp, cache owned by nginx, port 8080.
FROM nginx:1.31.10-alpine AS runner
RUN sed -i -e '/^user /d' -e 's,^pid .*,pid /tmp/nginx.pid;,' /etc/nginx/nginx.conf \
 && sed -i '/^http {/a \    client_body_temp_path /tmp/client_temp;\n    proxy_temp_path /tmp/proxy_temp;\n    fastcgi_temp_path /tmp/fastcgi_temp;\n    uwsgi_temp_path /tmp/uwsgi_temp;\n    scgi_temp_path /tmp/scgi_temp;' /etc/nginx/nginx.conf \
 && chown -R 101:101 /var/cache/nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080
