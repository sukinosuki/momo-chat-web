import { proxy } from 'valtio'

import { Notification } from '@/type/Notification'

type State = {
  notifications: Notification[]
}

const store = proxy<State>({
  notifications: [],
})

export default {
  store,

  add(message: string) {
    const notification: Notification = {
      id: Math.random(),
      message,
    }
    store.notifications.push(notification)
  },

  remove(id: number) {
    store.notifications = store.notifications.filter((item) => item.id !== id)
  },
}
