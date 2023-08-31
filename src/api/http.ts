import qs from 'query-string'

import authStore from '@/store/authStore'
import modalStore, { ModalType } from '@/store/modalStore'
import notificationStore from '@/store/notificationStore'

import { AppResponse } from '../type/AppResponse'

const BaseUrl = import.meta.env.VITE_API_BASE_URL

const handleJsonError = async (json: Promise<AppResponse>) => {
  setTimeout(async () => {
    const data = await json
    // console.log('[get] data ', data)
    // console.log('[get] data ', typeof data)

    if (data.code !== 0) {
      const msg = data.msg || JSON.stringify(data)
      if (modalStore.store.open) {
        notificationStore.add(msg)
      } else {
        modalStore.open(msg, ModalType.UN_AUTHORIZED)
      }
    }
  }, 0)
}

const handleError = async (error: any) => {
  console.log('[get] type error ', typeof error)
  console.log('[get] error cause ', error.cause)
  console.log('[get] error message ', error.message)
  console.log('[get] error stack ', error.stack)
  console.log('[get] error name ', error.name)

  setTimeout(() => {
    if (modalStore.store.open) {
      notificationStore.add(error.message)
    } else {
      modalStore.open(`${error.name}: ${error.stack}`)
    }
  }, 0)
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const http = <T = null>(
  method: HttpMethod,
  url: string,
  {
    data = null,
    headers = {},
  }: { data?: Record<any, any> | null; headers?: Record<string, string> } = {},
): Promise<AppResponse<T>> => {
  let body = null
  if (method === 'POST' || method === 'PUT') {
    body = JSON.stringify(data)
  }
  return fetch(url, {
    method: method,
    headers: {
      Authorization: authStore.token,
      ...headers,
    },
    body: body,
  })
    .then((res) => {
      const json = res.json()

      handleJsonError(json)

      return json
    })
    .catch((err: Error) => {
      handleError(err)
      return err
    })
}

//
const get = <T = null>(url: string, params = {}): Promise<AppResponse<T>> => {
  console.log('[get] params ', params)

  const query = qs.stringify(params)
  console.log('[get] query ', query)

  const _url = `${BaseUrl + url}?${query}`

  return http('GET', _url)
  // return fetch(_url, {
  //   method: 'GET',
  //   headers: {
  //     Authorization2: authStore.token,
  //   },
  // })
  //   .then((res) => {
  //     const json = res.json()

  //     handleJsonError(json)

  //     return json
  //   })
  //   .catch((err: Error) => {
  //     handleError(err)
  //     return err
  //   })
}

//
const post = <T = null>(url: string, data = {}): Promise<AppResponse<T>> => {
  const _url = BaseUrl + url

  return http('POST', _url, {
    data,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

export default {
  get,
  post,
}
