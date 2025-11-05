FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm install compression
RUN npm install

RUN npm run build

EXPOSE 5500

CMD ["npm", "run", "start:prod"]
