# Step 1: Build Vite app
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


EXPOSE 4173
CMD ["npm", "run", "preview"]