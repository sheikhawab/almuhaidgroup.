FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
