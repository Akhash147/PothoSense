// E:\Pothosense\frontend\src\context\AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

//  Axios instance 
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

API.interceptors.request.use(config => {
  const token =
    localStorage.getItem('supervisorToken') ||
    localStorage.getItem('staffToken')      ||
    localStorage.getItem('citizenToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { API };

//  Provider 
export const AppProvider = ({ children }) => {

  // Dark mode
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  //  Citizen 
  const [citizenToken, setCitizenToken] = useState(
    () => localStorage.getItem('citizenToken') || null
  );
  const [citizenUser, setCitizenUser] = useState(
    () => localStorage.getItem('citizenUser') || null
  );

  const loginCitizen = (token, username) => {
    localStorage.setItem('citizenToken', token);
    localStorage.setItem('citizenUser', username);
    setCitizenToken(token);
    setCitizenUser(username);
  };

  const logoutCitizen = () => {
    localStorage.removeItem('citizenToken');
    localStorage.removeItem('citizenUser');
    setCitizenToken(null);
    setCitizenUser(null);
  };

  //  Staff 
  const [staffToken, setStaffToken] = useState(
    () => localStorage.getItem('staffToken') || null
  );
  const [staffUser, setStaffUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('staffUser')); } catch { return null; }
  });

  const loginStaff = (token, userData) => {
    localStorage.setItem('staffToken', token);
    localStorage.setItem('staffUser', JSON.stringify(userData));
    setStaffToken(token);
    setStaffUser(userData);
  };

  const logoutStaff = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffUser');
    setStaffToken(null);
    setStaffUser(null);
  };

  //  Supervisor 
  const [supervisorToken, setSupervisorToken] = useState(
    () => localStorage.getItem('supervisorToken') || null
  );
  const [supervisorUser, setSupervisorUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('supervisorUser')); } catch { return null; }
  });

  const loginSupervisor = (token, userData) => {
    localStorage.setItem('supervisorToken', token);
    localStorage.setItem('supervisorUser', JSON.stringify(userData));
    setSupervisorToken(token);
    setSupervisorUser(userData);
  };

  const logoutSupervisor = () => {
    localStorage.removeItem('supervisorToken');
    localStorage.removeItem('supervisorUser');
    setSupervisorToken(null);
    setSupervisorUser(null);
  };

  //  Context value 
  return (
    <AppContext.Provider value={{
      darkMode, setDarkMode,
      citizenToken,    citizenUser,    loginCitizen,    logoutCitizen,
      staffToken,      staffUser,      loginStaff,      logoutStaff,
      supervisorToken, supervisorUser, loginSupervisor, logoutSupervisor,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
