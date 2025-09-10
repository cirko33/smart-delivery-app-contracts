import { getInjectedExtensions, connectInjectedExtension } from 'polkadot-api/pjs-signer'

export const getAccounts = async () => {
  const extensions = getInjectedExtensions()
  if (extensions.length > 0) {
    const extension = await connectInjectedExtension(extensions[0], "PureBite")
    return await extension.getAccounts()
  }
  return []
}
