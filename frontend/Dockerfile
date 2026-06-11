FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# O --host permite que o servidor Vite fique exposto para fora do container
CMD ["npm", "run", "dev", "--", "--host"]
