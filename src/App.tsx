import './App.css'

import { AnimatePresence, motion } from 'framer-motion'
import preloadjs from 'preload-js'
import { useEffect, useMemo, useState } from 'react'
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
  const notificationState = useSnapshot(notificationStore.store)

  const [preloadProgress, setPreloadProgress] = useState(0)
  const [isPreloadComplete, setIsPreloadComplete] = useState(false)

  const preloadProgressPercent = useMemo(() => {
    return (preloadProgress * 100).toFixed(0)
  }, [preloadProgress])

  //
  const handlePreload = () => {
    console.log('[handlePreload] preloadjs ', preloadjs)
    const preload = new preloadjs.LoadQueue()
    console.log('[handlePreload] preload ', preload)

    // If there is an open preload queue, close it.
    if (preload != null) {
      preload.close()
    }

    // File complete handler
    const handleFileLoad = (event) => {
      console.log(`Preloaded: ${event.item.id}`)
    }

    // Overall progress handler
    const handleOverallProgress = () => {
      console.log(' preload.progress ', preload.progress)
      setPreloadProgress(preload.progress)
      // document.getElementById('progress').style.width = `${
      //   preload.progress * document.getElementById('progress-wrap').clientWidth
      // }px`
    }

    // Error handler
    const handleFileError = (event) => {
      console.log(`error: ${event.item.id}, ${event.text}`)
    }

    const handleComplete = () => {
      console.log('loading complete')
      setIsPreloadComplete(true)
    }

    preload.on('fileload', handleFileLoad)
    preload.on('progress', handleOverallProgress)
    preload.on('error', handleFileError)
    preload.on('complete', handleComplete)

    // preload.loadFile('/resources/BG_MainOffice.jpg')
    // preload.loadFile('/src/assets/Blueaka.otf')
    // preload.loadFile('https://schale.gg/images/schale.png')
    preload.loadManifest([
      {
        it: 'font',
        src: '/assets/Blueaka.9865ad3a.otf',
      },
      {
        it: 'BG_MainOffice',
        src: '/assets/BG_MainOffice.b6f99792.jpg',
      },
      {
        it: 'schale',
        src: 'https://schale.gg/images/schale.png',
      },
      {
        it: 'framer-motion',
        src: '/assets/framer_motion.d565becc.js',
      },
      {
        it: 'react',
        src: '/assets/react.bef80f63.js',
      },
    ])
    preload.load()
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authStore.setToken(token)
    }

    handlePreload()
  }, [])

  return (
    <div className="App">
      {isPreloadComplete && <RouterProvider router={router}></RouterProvider>}

      <AnimatePresence>
        {!isPreloadComplete && (
          <motion.div
            exit={{
              opacity: 0,
              transition: {
                delay: 0.3,
              },
            }}
            className="fixed left-0 top-0 z-[999] flex h-screen w-screen  items-center justify-center bg-white"
          >
            <span className="text-sm">资源加载中{preloadProgressPercent}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed right-2 top-2 z-[999] flex w-72 flex-col gap-1">
        <AnimatePresence>
          {notificationState.notifications.map((n) => (
            <NotificationItem
              notification={n}
              remove={(id) => notificationStore.remove(id)}
              key={n.id}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
