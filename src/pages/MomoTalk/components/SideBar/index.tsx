import { motion } from 'framer-motion'
import React from 'react'

import SideMenu from '../SideMenu'

type TProps = {
  isInit: boolean
  activeIndex: number
  onIndexChange: (index: number) => void
}

//
const SideBar: React.FC<TProps> = (props) => {
  const { activeIndex, isInit } = props

  return (
    <div className="relative h-[100%] w-[80px] max-md:hidden">
      <motion.div
        variants={{
          open: {
            width: '100%',
            transition: {
              delay: 0.2,
            },
          },
          hide: {
            width: 0,
          },
        }}
        animate={isInit ? 'open' : 'hide'}
        className="absolute left-0 top-0 h-full w-full bg-[#4b5b6f]"
      ></motion.div>

      <motion.div
        initial="hide"
        variants={{
          open: {
            opacity: 1,
            transition: {
              delay: 0.5,
            },
          },
          hide: {
            opacity: 0,
          },
        }}
        animate={isInit ? 'open' : 'hide'}
        className="relative z-40 overflow-hidden"
      >
        <SideMenu
          icon="user"
          active={activeIndex === 0}
          onClick={() => props.onIndexChange(0)}
        />
        <SideMenu
          icon="message"
          active={activeIndex === 1}
          onClick={() => props.onIndexChange(1)}
        />
      </motion.div>
    </div>
  )
}

export default SideBar
