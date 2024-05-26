import httpClient from "@/lib/httpClient.js"
import { createContext, useContext, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { useEffectOnce } from "react-use"
import { clearToken, getToken, setToken, tokenLocalStageKey } from "@/auth/AuthHelpers.jsx"

const defaultValues = {
  isAuthenticated: false,
  username: null,
  login: () => {},
  logout: () => {}
}
const AuthContext = createContext(defaultValues);

export function AuthContextProvider(props) {
  const [jwtToken, setJwtToken] = useState(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!jwtToken);

  const jwtUsername = jwtToken ? jwtDecode(jwtToken)?.username : '__NO_USERNAME__';
  const [username, setUsername] = useState(jwtUsername);

  // subscribe to storage events so that we know when the axios interceptors clear the token
  useEffectOnce(() => {
    const syncLocalStorageToState = (event) => {
      if (event.key === tokenLocalStageKey && event.newValue === null) {
        logout();
      }
    }
    window.addEventListener('storage', syncLocalStorageToState);

    return () => {
      window.removeEventListener('storage', syncLocalStorageToState);
    }
  });

  async function login(username, password) {
    try {
      const response = await httpClient.post("login", {username, password});
      const jwtToken = response.data.token;
      const usernameValue = jwtDecode(jwtToken)?.username ?? '__NO_USERNAME__';

      setToken(jwtToken);
      setJwtToken(jwtToken);
      setIsAuthenticated(true);
      setUsername(usernameValue);
    } catch (error) {
      // Handle login errors, setting an error message
      const errorMessage = error?.response?.data?.message ?? '__NO_ERROR_MSG__';
      throw new Error(errorMessage);
    }
  }

  function logout() {
    clearToken();
    setJwtToken(null);
    setIsAuthenticated(false);
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      username,
      login,
      logout
    }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('useAuth must be provided within AuthContextProvider');
  }
  return authContext;
}
