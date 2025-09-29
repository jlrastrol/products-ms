FROM node:24-alpine3.21

WORKDIR /usr/src/app

# Update system packages to reduce vulnerabilities
RUN apk update && apk upgrade

COPY package*.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3001
