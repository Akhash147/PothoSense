// E:\Pothosense\frontend\src\context\AppContext.js
// ADD these to your existing AppContext — supervisor state alongside citizen/staff

// In the AppProvider function, add:
/*
  const [supervisorToken, setSupervisorToken] = useState(() => localStorage.getItem('supervisorToken'));
  const [supervisorUser,  setSupervisorUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('supervisorUser')); } catch { return null; }
  });

  const loginSupervisor = async (token, userData) => {
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

  // Add to context value:
  // supervisorToken, supervisorUser, loginSupervisor, logoutSupervisor
*/

// Also update API interceptor to send supervisor token:
/*
  API.interceptors.request.use(config => {
    const cToken = localStorage.getItem('citizenToken');
    const sToken = localStorage.getItem('staffToken');
    const supToken = localStorage.getItem('supervisorToken');
    const token = cToken || sToken || supToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
*/
