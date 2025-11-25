FROM node:24

WORKDIR /app

RUN npm install -g pnpm && curl -sSfL https://get.tur.so/install.sh | bash ; true

ENV PATH="/root/.turso:$PATH"