import { proxy } from 'valtio'

type ModalState = {
  type: number
  message: string
  open: boolean
  //   onOk?: () => void
  //   _ok?: () => Promise<any>
}

export enum ModalType {
  NORMAL = 1,
  UN_AUTHORIZED = 2,
}

const store = proxy<ModalState>({
  type: ModalType.NORMAL,
  message: '',
  open: false,
})

export default {
  store,
  open(message: string, type = ModalType.NORMAL) {
    store.type = type
    store.message = message
    store.open = true

    // store._ok = () =>
    //   new Promise((resolve) => {
    //     resolve('ok')
    //   })
  },
  onOk() {
    console.log('点击ok ')

    store.open = false
    store.message = new Date().getTime().toString()
    // return store._ok?.() || null
  },
}
