import { useAuthContext } from "./useAuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecondAuth } from "./useSecondAuth";
import axios from "axios";
import { toast } from "react-toastify";

export const useSignin = () => {
  const [loading, setLoading] = useState(false);
  const { dispatch: authDispatch } = useAuthContext();
  const { dispatch: secondAuthDispatch } = useSecondAuth();
  const navigate = useNavigate();

  const handleSignIn = async (url, formData, userId = null, redirectPath) => {
    setLoading(true);

    try {
      const response = await axios.post(url, userId ? { ...formData, userId } : formData, {
        headers: { 'Content-Type': 'application/json' }
      });

      const json = response.data;

      if (userId) {
        localStorage.setItem('secondUser', JSON.stringify(json));
        secondAuthDispatch({ type: 'LOGIN', payload: json });
      } else {
        localStorage.setItem('user', JSON.stringify(json));
        authDispatch({ type: 'LOGIN', payload: json });
      }

      setLoading(false);
      toast.success("Sign-in successful!");
      navigate(redirectPath);
    } catch (error) {
      setLoading(false);
      console.error("Error during sign-in:", error);
      throw error;
    }
  };

  const signinD = async (formData) => {
    return handleSignIn('/api/auth/signind', formData, null, '/dashboard');
  };

  const signinA = async (formData) => {
    return handleSignIn('/api/auth/signina', formData, null, '/dashboard');
  };

  const signinH = async (formData) => {
    return handleSignIn('/api/auth/signinh', formData, null, '/dashboard');
  };

  const signinHD = async (formData, userId) => {
    handleSignIn('/api/auth/signinhd', formData, userId, '/dashboard');
  };

  return { signinD, signinA, signinH, signinHD, loading };
};