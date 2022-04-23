import React, { useState} from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
export default function Header() {
  const Navigate = useNavigate()
//sate area 
  const [active, setActive] = useState(false)

//Function Area
  const logoutHanler = ()=>{
     window.localStorage.removeItem("jwt-normal-user")
     Navigate("/")
  }

  const activeHandler = ()=>{
    if(active===true){
      setActive(false)
    }else{
      setActive(true)
    }
  }

  return (
    <header>
      <div className="topbar">
        <div className="container">
          <div className="row">
            <div className="col-sm-8 text-sm">
              <div className="site-info">
                <a href="#"><span className="mai-call text-primary" /> +91 7089290621</a>
                <span className="divider">|</span>
                <a href='/' ><span className="mai-mail text-primary" /> patidarhealthcares@gmail.com</a>
              </div>
            </div>
            <div className="col-sm-4 text-right text-sm">
              <div className="social-mini-button">
                <a href="#"><span className="mai-logo-facebook-f" /></a>
                <a href="#"><span className="mai-logo-twitter" /></a>
                <a href="#"><span className="mai-logo-dribbble" /></a>
                <a href="#"><span className="mai-logo-instagram" /></a>
              </div>
            </div>
          </div> {/* .row */}
        </div> {/* .container */}
      </div> {/* .topbar */}
      <nav className="navbar navbar-expand-lg navbar-light shadow-sm">
        <div className="container">
          <NavLink className="navbar-brand" to="/"><span className="text-primary">Patidar</span>-Health</NavLink>
  
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupport" aria-controls="navbarSupport" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupport">
            <ul className="navbar-nav ml-auto">
              <li className="nav-item active">
                <NavLink className="nav-link" to="/">Home</NavLink>
              </li>
          
               {window.localStorage.getItem("jwt-normal-user") ? (
                 <>
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/contact">Appointment</NavLink>
                    </li> 
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/myappointments">My Appointments</NavLink>
                    </li> 
                     <li className='nav-item'>
                      <div className=" position-relative " >
                          <div className="d-flex align-items-center user_details" onClick={activeHandler}>
                          <span className="material-icons-sharp mx-md-1">account_circle</span>
                          <span>{  JSON.parse(window.localStorage.getItem("jwt-normal-user")).user.fname + " "+ JSON.parse(window.localStorage.getItem("jwt-normal-user")).user.lname}</span>
                          </div>
                          <div className={`user_details_content  p-2 py-3 rounded-bottom shadow wow zoomIn ${active?"active":""}`}>
                          <a href='/'  onClick={logoutHanler}  className="list"> 
                              <span className="material-icons-sharp">logout</span>
                               Logout
                          </a>
                          </div>
                      </div>
                    </li>
                </>
               ): (<>
                    <li className="nav-item">
                      <NavLink className="btn btn-primary ml-lg-3" to="/doctor-login">Doctors Login</NavLink>
                    </li>
                      <li className="nav-item">
                        <NavLink className="btn btn-primary my-md-0 my-2 ml-lg-3" to="/login-register" >Patient Login</NavLink>
                      </li>
               </>)}
            </ul>
          </div> {/* .navbar-collapse */}
        </div> {/* .container */}
      </nav>
  </header>
  )
}
