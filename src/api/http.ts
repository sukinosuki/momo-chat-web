import qs from 'query-string'

import authStore from '@/store/authStore'
import modalStore, { ModalType } from '@/store/modalStore'
import notificationStore from '@/store/notificationStore'

import { AppResponse } from '../type/AppResponse'

const BaseUrl = import.meta.env.VITE_API_BASE_URL

//
const get = <T = null>(url: string, params = {}): Promise<AppResponse<T>> => {
  console.log('[get] params ', params)

  const query = qs.stringify(params)
  console.log('[get] query ', query)

  const _url = `${BaseUrl + url}?${query}`

  return fetch(_url, {
    method: 'GET',
    headers: {
      Authorization: authStore.token,
    },
  })
    .then(async (res) => {
      const json = res.json()
      // console.log('json ', await json)

      // console.log('res.status ', res.status)

      setTimeout(async () => {
        const data = (await json) as AppResponse
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

      return json
    })
    .catch((err: Error) => {
      console.log('[get] err ', typeof err)
      console.log('[get] err ', err.cause)
      console.log('[get] err ', err.message)
      console.log('[get] err ', err.stack)
      console.log('[get] err ', err.name)

      if (modalStore.store.open) {
        notificationStore.add(err.message)
      } else {
        modalStore.open(`${err.name}: ${err.stack}`)
      }
      return err
    })
}

//
const post = <T = null>(url: string, data = {}): Promise<AppResponse<T>> => {
  const _url = BaseUrl + url

  return fetch(_url, {
    method: 'POST',
    headers: {
      Authorization: authStore.token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      const json = res.json()
      // console.log('json ', await json)

      console.log('res.status ', res.status)

      setTimeout(async () => {
        const data = (await json) as AppResponse
        if (data.code !== 0) {
          if (modalStore.store.open) {
            notificationStore.add(data.msg)
          } else {
            modalStore.open(data.msg, ModalType.UN_AUTHORIZED)
          }
        }
      }, 0)

      return json
    })
    .catch((err) => err)
}

export default {
  get,
  post,
}
