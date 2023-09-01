import { motion } from 'framer-motion'
import React from 'react'

import icon from '@/icon.svg'

type TProps = {
  isInit: boolean
}
//
const BoxLoading: React.FC<TProps> = (props) => {
  const { isInit } = props

  return (
    <motion.div
      variants={{
        hide: {
          height: 0,
        },
        open: {
          height: '100%',
        },
      }}
      animate={isInit ? 'hide' : 'open'}
      className="absolute left-0 top-0 z-50 z-[500] flex h-full w-full items-center justify-center overflow-hidden bg-[#fc8da2]"
    >
      <motion.div
        variants={{
          hide: {
            scale: 0.5,
            opacity: 0.6,
          },
          open: {
            opacity: 1,
            scale: 1.2,
            transition: {
              delay: 0.3,
            },
          },
        }}
        animate={isInit ? 'hide' : 'open'}
        className="flex flex-col items-center justify-center text-center"
      >
        <img className="h-[100px] w-[100px]" src={icon} alt="icon"></img>
        <span className="mt-2 text-2xl font-bold text-white">MomoTalk</span>
      </motion.div>
    </motion.div>
  )
}

export default BoxLoading
