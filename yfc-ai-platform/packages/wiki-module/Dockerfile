FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
EXPOSE 8080
CMD ["npm", "start"]
