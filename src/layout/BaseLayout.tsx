import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import authStore from '@/store/authStore'
import modalStore, { ModalType } from '@/store/modalStore'

type TProps = {
  children: React.ReactNode
}
//
const BaseLayout: React.FC<TProps> = (props) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { children } = props

  console.log('<BaseLayout> render ', authStore)

  if (!authStore.isLogin) {
    console.log('<BaseLayout> 请先登录')

    // navigate('/login')
    modalStore.open('请先登录', ModalType.UN_AUTHORIZED)

    return null
  }
  // const init = async () => {
  //   const token = localStorage.getItem('token')
  //   console.log('<BaseLayout> [init] token ', token)

  //   if (location.pathname === '/login') return

  //   if (!token) {
  //     navigate('/login')
  //   }
  // }

  // useEffect(() => {
  //   init()
  // }, [])

  return <>{children}</>
}

export default React.memo(BaseLayout, () => false)
