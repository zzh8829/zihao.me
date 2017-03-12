FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
RUN yarn install

COPY . .

EXPOSE 8080
CMD yarn start
