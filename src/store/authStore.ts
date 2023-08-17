import { proxy } from 'valtio'

import { Student } from '@/type/Student'

type Store = {
  isLogin: boolean
  token: string
  user: Student
}

const authStore = proxy<Store>({
  isLogin: false,
  token: '',
  user: {} as Student,
})

export const clear = () => {
  authStore.isLogin = false
  authStore.token = ''
  authStore.user = {} as Student
}

export default authStore
