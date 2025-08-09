FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["yarn", "start"]
