import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

import SkewButton from '../SkewButton'

type TProps = {
  open: boolean
  content: string
  title?: string
  onClose?: () => void
  onOk?: () => void
}

//
const Modal: React.FC<TProps> = (props) => {
  const { content, open, title } = props

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 z-[9999] flex h-full w-full items-center justify-center font-[blueaka]"
          >
            <div className="fixed left-0 top-0 z-50 h-full w-full bg-[#00000080]"></div>

            <motion.div
              initial={{ scale: 0.9, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.1, y: -20 }}
              className="z-50 flex w-[400px] flex-col overflow-hidden rounded-xl bg-white max-md:w-[80%]"
            >
              <div className="flex h-[40px] items-center justify-center bg-white">
                <h3 className="text-md font-bold">{title || 'Notice'}</h3>
              </div>

              <div className="overflow-hidden p-4">
                <div className="text-md max-h-[400px] overflow-y-auto text-center">
                  {content}
                </div>

                <div className="mt-8 flex">
                  {props.onClose && (
                    <SkewButton
                      onClick={props.onClose}
                      colored={!props.onOk}
                      className="flex-1"
                    >
                      Cancel
                    </SkewButton>
                  )}

                  {props.onOk && (
                    <SkewButton colored className="ml-4 flex-1 py-2" onClick={props.onOk}>
                      OK
                    </SkewButton>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Modal
