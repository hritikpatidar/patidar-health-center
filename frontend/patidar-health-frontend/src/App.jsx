import React, { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Page404 from './Comp/Error/Page404'
import Homepage from "./Comp/Homepage"
import AdminLogin from "./Admin/Comp/User/AdminLogin"
import AdminAppointment from './Admin/Comp/pages/AdminAppointment'
import LoginRegister from "./Comp/User/LoginRegister"
import Appoint from './Comp/Pages/Appoint'
import Users from './Admin/Comp/pages/Users'
import Dashboard from './Admin/Comp/pages/Dashboard'
import MyAppointment from './Comp/Pages/MyAppointment'
import DoctorLoginRegister from './Comp/User/DoctorLoginRegister'
import DoctorAppoint from './Doctor/Pages/DoctorAppoint'
import DoctorDashboard from './Doctor/Pages/DoctorDashboard'
import DoctorSchedule from './Doctor/Pages/DoctorSchedule'
import Doctors from './Admin/Comp/pages/Doctors'
export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.wow:not([data-wow-visible="true"])'))
    const reveal = (element) => {
      element.dataset.wowVisible = 'true'
      element.classList.add('is-visible')
    }
    const revealAll = () => elements.forEach(reveal)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealAll()
      return
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target)
          currentObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })

    elements.forEach((element) => {
      const delay = element.getAttribute('data-wow-delay')
      if (delay) element.style.transitionDelay = delay
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [pathname])

  return (
           
           <Routes>
            <Route path='/' element={<Homepage/>} />
            <Route path='/contact' element={<Appoint />} />
            <Route path='/myappointments' element={<MyAppointment />} />
            <Route path='/admin' element={<AdminLogin/>} />
            <Route path='/admin/dashboard' element={<Dashboard/>} />
            <Route path='/admin/users' element={<Users/>} />
            <Route path='/admin/doctors' element={<Doctors/>} />
            <Route path='/doctor/appointments' element={<DoctorAppoint/>}/>
            <Route path='/doctor/schedule' element={<DoctorSchedule/>}/>
            <Route path='/doctor/dashboard' element={<DoctorDashboard/>}/>
            <Route path='/login-register' element={<LoginRegister/>} />
            <Route path='/doctor-login' element={<DoctorLoginRegister/>} />
            <Route path='/admin/appointments' element={<AdminAppointment/>} />
            <Route path='*' element={<Page404/>} />
          </Routes>    

   
  )
}
