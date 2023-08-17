import { useMemo } from 'react'
import { useNavigate, useNavigation, useRouteError } from 'react-router-dom'

import Modal from '@/components/Modal'

export default function ErrorPage() {
  const error = useRouteError() as { statusText: string; status: number; data: string }
  console.error(error)
  const navigate = useNavigate()
  // const navigation  =useNavigation()

  //
  const errorMsg = useMemo(() => {
    const { statusText, status, data } = error

    return `${status}: ${statusText} | ${data}`
  }, [error])

  const handleOk = () => {
    navigate('/', {
      replace: true,
    })
    //
  }
  return (
    <div id="error-page">
      {/* <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p> */}

      <Modal open content={errorMsg} onOk={handleOk}></Modal>
    </div>
  )
}