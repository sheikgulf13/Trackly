"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "./Input";
import axios from "axios";
import Link from "next/link";

const AuthForm = ({ type, role }) => {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: role });
  const [error, setError] = useState("");

  const isLogin = type === "login";
  const routeRole = role === 'User' ? 'user' : 'admin';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = `http://localhost:5000/api/auth/${type}`;
      const res = await axios.post(endpoint, form);
      if (res.status === 200 || res.status === 201) {
        console.log(res)
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('role', role);
        router.push(`/${routeRole}/dashboard`);
      }
    } catch (err) {
      setError(err || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-purple-800">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? "Sign in to your account" : "Join us today"}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="space-y-4">
            {!isLogin && (
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="text-gray-900 placeholder-gray-700"
              />
            )}
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="text-gray-900 placeholder-gray-700"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="text-gray-900 placeholder-gray-700"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error.toString()}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white rounded-lg py-3 hover:bg-purple-700 transition-colors duration-200 font-medium"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Link 
                href={`/${routeRole}/${isLogin ? 'register' : 'login'}`}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                {isLogin ? "Register" : "Login"}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
