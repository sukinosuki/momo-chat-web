import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import authStore from '@/store/authStore'
import modalStore, { ModalType } from '@/store/modalStore'

type TProps = {
  children: React.ReactNode
}

//
const BaseLayout: React.FC<TProps> = (props) => {
  const { children } = props

  console.log('<BaseLayout> render ', authStore)

  if (!authStore.state.isLogin) {
    console.log('<BaseLayout> 请先登录')

    // navigate('/login')
    modalStore.open('请先登录', ModalType.UN_AUTHORIZED)

    return null
  }

  return <>{children}</>
}

export default React.memo(BaseLayout, () => false)
