FROM node:alpine
WORKDIR /root/rudresh/docker-workdir/simple-microservice--auth
COPY package.json ./
RUN npm i
COPY ./ ./
CMD  ["npm", "run","start"]
