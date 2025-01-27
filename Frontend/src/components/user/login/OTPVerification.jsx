import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import api from '../../../api';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserData } from '../../../slices/user/userSlice';
import { decodeToken } from '../../../utils/tokenUtils';
import { ACCESS_TOKEN, REFRESH_TOKEN} from '../../../constants/authConstants';



const OTPVerification = ({ email, setIsOtpSent }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    useEffect(() => {
      let timer;
      if (resendCooldown > 0) {
        timer = setInterval(() => {
          setResendCooldown(prev => prev - 1);
        }, 1000);
      }
      return () => clearInterval(timer);
    }, [resendCooldown]);
  
    const handleResendOTP = async () => {
      if (resendCooldown > 0) return;
        
      setResendLoading(true);
      setError('');
    
      try {
        const response = await api.post('/api/users/resend-otp/', { email });
        setResendCooldown(60);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to resend OTP';
        setError(errorMessage);
      } finally {
        setResendLoading(false);
      }
    };
    
    const handleVerifyOTP = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
    
      try {
        const response = await api.post('/api/users/verify-otp/', { email, otp });
        console.log('OTP Verification Response:', response.data);
  
        // Store tokens
        localStorage.setItem(ACCESS_TOKEN, response.data.tokens.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.tokens.refresh);
        
        // Decode token
        const decodedToken = decodeToken(response.data.tokens.access);
        console.log('Decoded Token:', decodedToken);
  
        // Dispatch user data
        dispatch(setUserData({
          email: decodedToken.email,
          first_name: decodedToken.first_name,
          last_name: decodedToken.last_name,
          image: decodedToken.image || null,
          isAuthenticated: true,
        }));
  
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify({
          user_id: decodedToken.user_id,
          email: decodedToken.email,
          first_name: decodedToken.first_name,
          last_name: decodedToken.last_name,
          image: decodedToken.image || null,
        }));
        localStorage.setItem('isAuthenticated', 'true');
  
  
        // Set default Authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.tokens.access}`;
  
  
        // Navigate to home
        navigate('/home');
      } catch (err) {
        console.error('OTP Verification Error:', err);
        setError(err.response?.data?.error || 'Failed to verify OTP');
      } finally {
        setLoading(false);
      }
    };
  
    const handleOTPChange = (e) => {
      const value = e.target.value.replace(/\D/g, '');
      if (value.length <= 6) {
        setOtp(value);
        setError('');
      }
    };
  
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <p className="text-sm text-gray-400 text-center">
          We've sent a verification code to {email}
        </p>
  
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
            Enter OTP
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            required
            maxLength={6}
            pattern="\d{6}"
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-gray-100 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={handleOTPChange}
          />
        </div>
  
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
  
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center">
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Verifying...
            </span>
          ) : (
            'Verify OTP'
          )}
        </button>
  
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOtpSent(false)}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendLoading || resendCooldown > 0}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {resendLoading ? 'Resending...' : 
             resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>
      </form>
    );
  };

export default OTPVerification;