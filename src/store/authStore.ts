import { proxy } from 'valtio'

import { Student } from '@/type/Student'

type Store = {
  isLogin: boolean
  token: string
  user: Student
}

const state = proxy<Store>({
  isLogin: false,
  token: '',
  user: {} as Student,
})

const clear = () => {
  state.isLogin = false
  state.token = ''
  state.user = {} as Student
}

const setToken = (token: string) => {
  state.token = token
  state.isLogin = true
}

const setUser = (user: Student) => {
  state.user = user
  state.isLogin = true
}

export default {
  state,
  clear,
  setToken,
  setUser,
}
