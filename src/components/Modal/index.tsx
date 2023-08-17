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
            className="w-full h-full fixed top-0 left-0 z-50 flex items-center justify-center font-[blueaka]"
          >
            <div className="w-full h-full fixed top-0 left-0 z-50 bg-[#00000080]"></div>

            <motion.div
              initial={{ scale: 0.9, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.1, y: -20 }}
              className="flex flex-col w-[400px] rounded-xl overflow-hidden bg-white z-50"
            >
              <div className="bg-white h-[40px] flex justify-center items-center">
                <h3 className="text-md font-bold">{title || 'Notice'}</h3>
              </div>

              <div className="p-4 overflow-hidden">
                <div className="overflow-y-auto max-h-[400px] text-md text-center">
                  {content}
                </div>

                <div className="flex mt-8">
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
                    <SkewButton colored className="flex-1 ml-4" onClick={props.onOk}>
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
