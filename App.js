// E:\Pothosense\frontend\src\App.js — v4
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { TranslatorProvider } from './utils/AITranslator';
import './index.css';

import Home              from './pages/Home';
import CitizenAuth       from './pages/CitizenAuth';
import StaffLogin        from './pages/StaffLogin';
import SupervisorLogin   from './pages/SupervisorLogin';
import SupervisorDashboard from './pages/SupervisorDashboard';
import CitizenReport     from './pages/CitizenReport';
import TrackReport       from './pages/TrackReport';
import MyReports         from './pages/MyReports';
import StaffDashboard    from './pages/StaffDashboard';
import Leaderboard       from './pages/Leaderboard';
import RouteSafety       from './pages/RouteSafety';
import VerifyRepairs     from './pages/VerifyRepairs';
import PotholeMap        from './pages/PotholeMap';

const CitizenRoute    = ({ c }) => { const { citizenToken }    = useApp(); return citizenToken    ? c : <Navigate to="/login" />; };
const StaffRoute      = ({ c }) => { const { staffToken }      = useApp(); return staffToken      ? c : <Navigate to="/staff/login" />; };
const SupervisorRoute = ({ c }) => { const { supervisorToken } = useApp(); return supervisorToken ? c : <Navigate to="/supervisor/login" />; };

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                   element={<Home />} />
        <Route path="/login"              element={<CitizenAuth />} />
        <Route path="/register"           element={<CitizenAuth />} />
        <Route path="/staff/login"        element={<StaffLogin />} />
        <Route path="/supervisor/login"   element={<SupervisorLogin />} />
        <Route path="/track"              element={<TrackReport />} />
        <Route path="/leaderboard"        element={<Leaderboard />} />
        <Route path="/map"                element={<PotholeMap />} />
        <Route path="/route-safety"       element={<RouteSafety />} />
        {/* Citizen protected */}
        <Route path="/citizen/report"     element={<CitizenRoute c={<CitizenReport />} />} />
        <Route path="/citizen/track"      element={<TrackReport />} />
        <Route path="/citizen/my-reports" element={<CitizenRoute c={<MyReports />} />} />
        <Route path="/citizen/verify"     element={<CitizenRoute c={<VerifyRepairs />} />} />
        {/* Staff protected */}
        <Route path="/staff/dashboard"    element={<StaffRoute c={<StaffDashboard />} />} />
        {/* Supervisor protected */}
        <Route path="/supervisor/dashboard" element={<SupervisorRoute c={<SupervisorDashboard />} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <TranslatorProvider>
        <AppRoutes />
      </TranslatorProvider>
    </AppProvider>
  );
}
