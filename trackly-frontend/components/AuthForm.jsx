"use client";

import { useState, memo, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Input from "./Input";
import axios from "axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";

const AuthForm = memo(function AuthForm({ type, role }) {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: role });
  const [formError, setFormError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = type === "login";
  const routeRole = role === 'User' ? 'user' : 'admin';

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    setFormError("");
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setAuthError("");
    
    try {
      const res = await api.post(`/auth/${type}`, form);
      if (res.status === 200 || res.status === 201) {
        const userRole = res.data.user?.role;
        
        if (pathname.startsWith('/admin') && res.data.user.role !== 'Admin') {
          console.log('hellooo')
          setAuthError('Unauthorized: You are not an Admin, try logging in as a User');
          setIsLoading(false);
          return;
        }
        if (pathname.startsWith('/user') && userRole !== 'User') {
          setAuthError('Unauthorized: You are not a User, try logging in as an Admin');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('role', role);
        router.push(`/${routeRole}/dashboard`);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        setAuthError(err?.response?.data?.message || "Unauthorized access");
      } else {
        setFormError(err?.response?.data?.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  }, [form, type, role, routeRole, router]);

  const clearErrors = useCallback(() => {
    if (formError || authError) {
      const timer = setTimeout(() => {
        setFormError("");
        setAuthError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [formError, authError]);

  useEffect(() => {
    clearErrors();
  }, [formError, authError, clearErrors]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full space-y-8"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-3 text-gray-600 text-lg">
            {isLogin ? "Sign in to your account" : "Join us today"}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-purple-100"
        >
          <div className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="text-gray-900 placeholder-gray-700"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="text-gray-900 placeholder-gray-700"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="text-gray-900 placeholder-gray-700"
              />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100"
              >
                {formError}
              </motion.div>
            )}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-orange-500 text-sm text-center bg-orange-50 p-3 rounded-lg border border-orange-100"
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl py-3.5 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg shadow-purple-100 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
              />
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </motion.button>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="text-center mt-6"
          >
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Link 
                href={`/${routeRole}/${isLogin ? 'register' : 'login'}`}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
              >
                {isLogin ? "Register" : "Login"}
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
});

export default AuthForm;
