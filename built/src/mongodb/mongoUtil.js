'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.getMongoClient = void 0
const mongodb_1 = require('mongodb')
const getMongoClient = async (uri) => {
  return new mongodb_1.MongoClient(uri, {
    serverApi: {
      version: mongodb_1.ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })
}
exports.getMongoClient = getMongoClient
