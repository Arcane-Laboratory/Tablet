import { MongoClient, ServerApiVersion } from 'mongodb'

const getMongoClient = async (uri) => {
  return new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })
}

export { getMongoClient }
