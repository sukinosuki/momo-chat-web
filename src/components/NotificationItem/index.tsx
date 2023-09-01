import { motion } from 'framer-motion'
import React, { useEffect } from 'react'

import { Notification } from '@/type/Notification'

const NOTIFICATION_TTL = 5000

type TProps = {
  notification: Notification
  remove: (id: number) => void
}

//
const NotificationItem: React.FC<TProps> = ({ notification, remove }) => {
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      remove(notification.id)
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
      className="pointer-events-auto flex select-none items-start gap-2 rounded bg-momo p-2 text-xs font-medium text-white shadow-lg"
    >
      <span>{notification.message}</span>
    </motion.div>
  )
}

export default NotificationItem
