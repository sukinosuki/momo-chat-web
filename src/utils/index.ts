import { AppResponse } from '../type/AppResponse'

export const sleep = (duration = 300) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('ok')
    }, duration)
  })
}

// to catch
export const toCatch = <T = null>(
  fn: Promise<AppResponse<T>>,
): Promise<[Error | null, T]> => {
  return fn
    .then((res) => {
      console.log('[toCatch] res ', res)
      if (res.code !== 0) return [new Error(`${res.code}: ${res.msg}`), null]

      return [null, res.data] as any
    })
    .catch((err: Error) => {
      console.log('[toCatch] err ', err)
      return [err, null]
    })
}
