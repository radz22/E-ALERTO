import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ Added

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");
      if (data.success) {
        setIsLoggedIn(true);
        await getUserData(); // ✅ Await this to ensure userData is ready
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false); // ✅ Done checking auth
    }
  };

  const getUserData = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(backendUrl + "/api/user/data");
      if (data.success) {
        setUserData(data.userData); // Ensure this includes isAccountVerified
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false); // Data has finished loading
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    backendUrl,
    isLoggedIn,
    setIsLoggedIn,
    userData,
    setUserData,
    getUserData,
    isLoading, // ✅ Expose to App.jsx
  };

  return (
    <AppContent.Provider value={value}>{props.children}</AppContent.Provider>
  );
};
