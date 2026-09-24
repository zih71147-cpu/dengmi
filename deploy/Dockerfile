# 多阶段构建：Node 构建静态产物 → Nginx 托管（适合自建服务器 / 任意容器平台）
#
# 用法（在项目根目录执行，Vite 环境变量需在构建期通过 --build-arg 传入）：
#   docker build -f deploy/Dockerfile \
#     --build-arg VITE_GITEE_OWNER=你的用户名 \
#     --build-arg VITE_GITEE_REPO=midautumn-riddle-data \
#     --build-arg VITE_GITEE_PAT=你的Gitee令牌 \
#     --build-arg VITE_SITE_URL=https://你的域名 \
#     -t midautumn-riddle-quiz .
#   docker run -d -p 8080:80 --restart always midautumn-riddle-quiz
#
# 也可直接 docker compose 使用（见 README 方式四）。

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Vite 环境变量在构建期注入（构建后会被写进静态 JS，无法在运行时修改）
ARG VITE_GITEE_OWNER=""
ARG VITE_GITEE_REPO=""
ARG VITE_GITEE_PAT=""
ARG VITE_SITE_URL=""
ARG VITE_ADMIN_PASSWORD="admin888"
ENV VITE_GITEE_OWNER=$VITE_GITEE_OWNER \
    VITE_GITEE_REPO=$VITE_GITEE_REPO \
    VITE_GITEE_PAT=$VITE_GITEE_PAT \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD

RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
