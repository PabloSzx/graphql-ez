---
'@graphql-ez/client': minor
'@graphql-ez/express-testing': minor
'@graphql-ez/fastify-testing': minor
'@graphql-ez/hapi-testing': minor
'@graphql-ez/http-testing': minor
'@graphql-ez/koa-testing': minor
---

Change from Undici Client instance to Undici Pool instance (improve concurrency, use "undiciOptions.connections" option to limit it)
