import './index.scss'

import { motion } from 'framer-motion'
import React, { HTMLAttributes } from 'react'

type TProps = {
  colored?: boolean
  onClick: () => void
  children: React.ReactNode
  shadow?: boolean
} & HTMLAttributes<HTMLButtonElement>

//
const SkewButton: React.FC<TProps> = (props) => {
  const { children, colored, shadow, className, ...rest } = props

  return (
    // <button className="skew-button" onClick={props.onClick}>
    //   {children}
    // </button>
    <motion.button
      initial={{
        skewX: -15,
        // backgroundColor: colored ? '#3bc7ff' : '#c5e0fe',
      }}
      whileHover={{
        scale: 1.02,
        skewX: -15,
        transition: {
          // duration: 0.2,
          // damping: 1100,
          // mass: 10,
        },
        // backgroundColor: '#3bc7ff',
      }}
      className={[
        className,
        `skew-button -skew-x-[15deg] rounded-md ${
          colored ? 'bg-[#3bc7ff]' : 'bg-[#c5e0fe]'
        } ${shadow ? 'shadow-md' : ''} text-[14px] text-white`,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export default SkewButton
