FROM node:20-alpine

WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
