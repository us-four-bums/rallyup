FROM mhart/alpine-node:latest

RUN apk update

# get dumb-ini
RUN apk add ca-certificates openssl && update-ca-certificates
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.1.3/dumb-init_1.1.3_amd64
RUN chmod a+x /usr/local/bin/dumb-init

# grab dependencies if package.json has been modified
COPY package.json /tmp/package.json
RUN cd /tmp && npm install --production
RUN mkdir /app && cp -a /tmp/node_modules /app

WORKDIR /app
COPY . /app

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
CMD ["npm", "start"]
