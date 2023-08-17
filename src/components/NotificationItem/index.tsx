import { motion } from 'framer-motion'
import React, { useEffect } from 'react'

import { Notification } from '@/type/Notification'

const NOTIFICATION_TTL = 5000

type TProps = {
  notification: Notification
  removeNotif: (id: number) => void
}

//
const NotificationItem: React.FC<TProps> = ({ notification, removeNotif }) => {
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      removeNotif(notification.id)
    }, NOTIFICATION_TTL)

    return () => clearTimeout(timeoutRef)
  }, [])

  return (
    <motion.div
      layout
      initial={{ y: -15, scale: 0.95 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-2 flex items-start rounded gap-2 text-xs font-medium shadow-lg text-white bg-momo pointer-events-auto font-[blueaka] select-none"
    >
      {/* <FiCheckSquare className=" mt-0.5" /> */}
      <span>{notification.message}</span>
      {/* <button onClick={() => removeNotif(notification.id)} className="ml-auto mt-0.5">
        x
      </button> */}
    </motion.div>
  )
}

export default NotificationItem
