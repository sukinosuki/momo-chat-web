import { motion } from 'framer-motion'
import React from 'react'

import icon from '@/icon.svg'

type TProps = {
  isInit: boolean
}

//
const BoxHeader: React.FC<TProps> = (props) => {
  const { isInit } = props
  //   bg-[linear-gradient(#ff899e,#f79bac)]

  return (
    <div className="flex h-[48px] flex-row items-center justify-center bg-momo px-4 md:h-[60px] md:justify-start">
      <motion.div
        variants={{
          hide: {
            y: '40%',
          },
          open: {
            y: 0,
            transition: {
              delay: 0.2,
            },
          },
        }}
        animate={isInit ? 'open' : 'hide'}
        className="flex flex-row items-center"
      >
        <img className="h-[35px] w-[35px]" src={icon} alt="icon" />
        <h1 className="ml-2 text-2xl font-bold text-white">MomoTalk</h1>
      </motion.div>
    </div>
  )
}

export default BoxHeader
