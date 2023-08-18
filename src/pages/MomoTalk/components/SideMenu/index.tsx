import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

import { BaMessage, BaUser } from '@/components/icons'
type TProps = {
  active?: boolean
  icon: 'user' | 'message'
  onClick?: () => void
}

const SideMenu: React.FC<TProps> = (props) => {
  const { active, icon } = props

  return (
    <motion.div
      // whileHover={{ scale: 1.05 }}
      // whileTap={{ scale: 0.95 }}
      className={`w-[80px] h-[80px] cursor-pointer relative flex flex-row justify-center items-center ${
        active ? '' : ''
      } `}
      onClick={props.onClick}
    >
      <span style={{ zIndex: 1 }}>
        {icon === 'user' && <BaUser></BaUser>}

        {icon === 'message' && <BaMessage></BaMessage>}
      </span>

      {/* <AnimatePresence> */}
      {active && (
        <motion.div
          // initial={{ scale: 0 }}
          // animate={{ scale: 1 }}
          // exit={{ scale: 0 }}
          className={`bg-[#67788d] w-full h-full absolute top-0 left-0 z-0`}
        ></motion.div>
      )}
      {/* </AnimatePresence> */}
    </motion.div>
  )
}

export default SideMenu
