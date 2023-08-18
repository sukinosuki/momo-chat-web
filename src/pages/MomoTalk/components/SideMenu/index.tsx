import { motion } from 'framer-motion'
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
      className={`w-[80px] h-[80px] cursor-pointer flex flex-row justify-center items-center ${
        active ? 'bg-[#67788d]' : ''
      } `}
      whileTap={{ scale: 0.9 }}
      onClick={props.onClick}
    >
      {icon === 'user' && <BaUser></BaUser>}
      {icon === 'message' && <BaMessage></BaMessage>}
    </motion.div>
  )
}

export default SideMenu
