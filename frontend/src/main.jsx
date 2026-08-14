import React from 'react'
import { createRoot } from 'react-dom/client'
import SiteRouter from './SiteRouter'
import { UserProvider } from './context/UserContext'
import './index.css'
createRoot(document.getElementById('root')).render(<React.StrictMode><UserProvider><SiteRouter/></UserProvider></React.StrictMode>)
