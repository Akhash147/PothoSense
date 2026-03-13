// ADD THESE LINES to your existing AppContext.js
// Search for where citizenToken / staffToken are defined and add alongside them

// 1. State (add near citizenToken/staffToken state):
const [supervisorToken, setSupervisorToken] = useState(() => 
  typeof AsyncStorage !== 'undefined' ? null : null  // loaded in useEffect below
);
const [supervisorUser, setSupervisorUser] = useState(null);

// 2. Load on mount (add inside the useEffect that loads citizen/staff tokens):
//    const supToken = await AsyncStorage.getItem('supervisorToken');
//    const supUser  = await AsyncStorage.getItem('supervisorUser');
//    if (supToken) { setSupervisorToken(supToken); }
//    if (supUser)  { setSupervisorUser(JSON.parse(supUser)); }

// 3. Login/logout functions:
const loginSupervisor = async (token, userData) => {
  await AsyncStorage.setItem('supervisorToken', token);
  await AsyncStorage.setItem('supervisorUser', JSON.stringify(userData));
  setSupervisorToken(token);
  setSupervisorUser(userData);
};

const logoutSupervisor = async () => {
  await AsyncStorage.removeItem('supervisorToken');
  await AsyncStorage.removeItem('supervisorUser');
  setSupervisorToken(null);
  setSupervisorUser(null);
};

// 4. Add to context value object:
//    supervisorToken, supervisorUser, loginSupervisor, logoutSupervisor

// 5. Update API interceptor — also check supervisorToken:
//    const token = citizenToken || staffToken || supervisorToken;
