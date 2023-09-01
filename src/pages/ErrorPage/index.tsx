import { useMemo } from 'react'
import { useNavigate, useNavigation, useRouteError } from 'react-router-dom'

import Modal from '@/components/Modal'

export default function ErrorPage() {
  const error = useRouteError() as {
    statusText: string
    status: number
    data: string
    message: string
  }

  console.log('<ErrorPage> error ', error)

  const navigate = useNavigate()

  //
  const errorMsg = useMemo(() => {
    const { statusText, status, data } = error

    return status ? `${status}: ${statusText} | ${data}` : error.toString()
  }, [error])

  const handleOk = () => {
    // TODO:
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
