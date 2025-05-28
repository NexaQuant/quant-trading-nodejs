# 使用官方 Node.js LTS (Long Term Support) 版本作为基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json (或 yarn.lock)
COPY package*.json ./

# 安装项目依赖 (包括 devDependencies 以便构建)
RUN npm install

# 复制项目源码
COPY . .

# 编译 TypeScript 代码
RUN npm run build
# 查看构建产物
RUN ls -la /usr/src/app/dist

# 第二阶段：创建更小的生产镜像
FROM node:18-alpine

WORKDIR /usr/src/app

# 从构建器阶段复制 package.json 和 node_modules
COPY package*.json ./
RUN npm install --production --ignore-scripts

# 从构建器阶段复制编译后的代码
# 从构建器阶段复制编译后的代码
COPY --from=builder /usr/src/app/dist ./dist
# 查看复制后的产物
RUN ls -la /usr/src/app/dist

# 复制 ecosystem.config.js (如果使用 PM2)
COPY ecosystem.config.js .

# 暴露应用程序使用的端口 (与 ecosystem.config.js 或 .env 中配置的端口一致)
EXPOSE 3000

# 运行应用的命令 (使用 PM2)
CMD [ "npx", "pm2-runtime", "start", "ecosystem.config.js" ]