FROM node:8-alpine
WORKDIR /covid-19-rest-bg/
# create local user
COPY . .

RUN chown -R node:node /covid-19-rest-bg

USER node
RUN npm install