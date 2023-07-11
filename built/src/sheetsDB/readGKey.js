'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.getGkey = void 0
const getGkey = () => {
  if (!process.env) throw 'no env found'
  const gkey = process.env.GKEY
    ? process.env.GKEY.replace(/\\n/g, '\n')
    : undefined
  const email = process.env.EMAIL
  if (!gkey) throw 'gkey file missing private_key'
  if (!email) throw 'gkey file missing client_email'
  return { private_key: gkey, client_email: email }
}
exports.getGkey = getGkey
