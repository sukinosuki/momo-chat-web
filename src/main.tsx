import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'

// import { createRoot } from 'react-dom/client'
import App from './App'

// const container = document.getElementById('root')
// createRoot(container).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
)
