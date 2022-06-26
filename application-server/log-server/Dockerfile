FROM node:16.15
WORKDIR /app
COPY logs.json .
RUN npm i -g json-server
EXPOSE 8004
CMD ["json-server","-H","0.0.0.0","logs.json"]