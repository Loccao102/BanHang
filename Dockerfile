FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# postinstall runs scripts/prisma-generate.mjs, so these files must exist
# before npm install is executed.
COPY package.json ./
COPY prisma ./prisma
COPY scripts ./scripts

RUN npm install

COPY . .

ARG NEXT_PUBLIC_BANK_ID=MB
ARG NEXT_PUBLIC_BANK_ACCOUNT=0123456789
ARG NEXT_PUBLIC_BANK_ACCOUNT_NAME=LSOUL

ENV NEXT_PUBLIC_BANK_ID=$NEXT_PUBLIC_BANK_ID
ENV NEXT_PUBLIC_BANK_ACCOUNT=$NEXT_PUBLIC_BANK_ACCOUNT
ENV NEXT_PUBLIC_BANK_ACCOUNT_NAME=$NEXT_PUBLIC_BANK_ACCOUNT_NAME

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000 3001

CMD ["npm", "start"]
