import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

type TProps = {
  open: boolean
}

//
const WsClosedModal: React.FC<TProps> = (props) => {
  const _text = '...'
  const { open } = props

  const [text, setText] = useState(_text)
  useEffect(() => {
    const timer = setInterval(() => {
      if (text === '...') {
        setText('')
      } else {
        setText(_text.substring(0, text.length + 1))
      }
    }, 300)

    return function () {
      clearInterval(timer)
    }
  })
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-[700]"
        >
          <div className="w-full h-full fixed top-0 left-0 z-[800] bg-[#00000080] flex items-center justify-center select-none">
            <div className="w-[170px]">
              <span className="text-white text-sm">连接断开, 正在重新连接{text}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WsClosedModal
