import qs from 'query-string'

import authStore from '@/store/authStore'
import modalStore, { ModalType } from '@/store/modalStore'
import notificationStore from '@/store/notificationStore'

import { AppResponse } from '../type/AppResponse'

const BaseUrl = import.meta.env.VITE_API_BASE_URL

const handleJsonError = async (res: AppResponse) => {
  setTimeout(async () => {
    if (res.code !== 0) {
      const msg = res.msg || JSON.stringify(res)
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
      Authorization: authStore.state.token,
      ...headers,
    },
    body: body,
  })
    .then(async (res) => {
      const json = await res.json()

      handleJsonError(json)

      return json
    })
    .catch((err: Error) => {
      handleError(err)
      return err
    })
}

//
const get = <T = null>(
  url: string,
  params?: Record<any, any>,
): Promise<AppResponse<T>> => {
  console.log('[get] params ', params)

  let _url = BaseUrl + url
  if (params) {
    _url += `?${qs.stringify(params)}`
  }

  return http('GET', _url)
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
