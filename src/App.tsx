import './App.css'

import { AnimatePresence, motion } from 'framer-motion'
import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
  useOutlet,
} from 'react-router-dom'
import { useSnapshot } from 'valtio'

import NotificationItem from '@/components/NotificationItem'

import Modal from './components/Modal'
import BaseLayout from './layout/BaseLayout'
import ErrorPage from './pages/ErrorPage'
import Login from './pages/Login'
import MomoTalk from './pages/MomoTalk'
import authStore from './store/authStore'
import modalStore, { ModalType } from './store/modalStore'
import notificationStore from './store/notificationStore'

const RooterContainer = () => {
  const outlet = useOutlet()
  const navigate = useNavigate()

  const modalState = useSnapshot(modalStore.store)

  const handleModalOk = () => {
    modalStore.onOk()

    if (modalState.type === ModalType.UN_AUTHORIZED) {
      navigate('/login')
    }
  }

  return (
    <>
      {outlet}
      <Modal
        open={modalState.open}
        content={modalState.message}
        onOk={handleModalOk}
      ></Modal>
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RooterContainer />,
    children: [
      {
        index: true,
        element: (
          <BaseLayout>
            <MomoTalk></MomoTalk>
          </BaseLayout>
        ),
      },
      {
        path: '/login',
        element: <Login></Login>,
      },
    ],
    errorElement: <ErrorPage />,
  },
])

function App() {
  const token = localStorage.getItem('token')
  const notificationState = useSnapshot(notificationStore.store)

  if (token) {
    authStore.token = token
    authStore.isLogin = true
  }

  return (
    <div className="App">
      <RouterProvider router={router}></RouterProvider>

      <div className="flex flex-col gap-1 w-72 fixed top-2 right-2 z-50 pointer-events-none">
        <AnimatePresence>
          {notificationState.notifications.map((n) => (
            <NotificationItem
              notification={n}
              removeNotif={(id) => notificationStore.remove(id)}
              key={n.id}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
