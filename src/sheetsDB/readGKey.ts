interface gKey {
  private_key: string
  client_email: string
}

const getGkey = (): gKey => {
  if (!process.env) throw 'no env found'
  const gkey = process.env.GKEY
    ? process.env.GKEY.replace(/\\n/g, '\n')
    : undefined
  const email = process.env.EMAIL
  if (!gkey) throw 'gkey file missing private_key'
  if (!email) throw 'gkey file missing client_email'
  return { private_key: gkey, client_email: email }
}

export { getGkey, gKey }
