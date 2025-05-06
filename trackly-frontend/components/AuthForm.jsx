"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "./Input";
import axios from "axios";

const AuthForm = ({ type, role }) => {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: role });
  const [error, setError] = useState("");

  const isLogin = type === "login";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const routeRole = role === 'user' ? 'user' : 'admin'

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
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white min-h-[50vh] rounded-xl shadow-md"
    >
      <h2 className="text-xl font-semibold mb-4">
        {isLogin ? "Login" : "Register"} as {role}
      </h2>
      {!isLogin && (
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      )}
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
      />
      {error && <p className="text-red-500 text-sm mb-2">{error.toString()}</p>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
      >
        {isLogin ? "Login" : "Register"}
      </button>
    </form>
  );
};

export default AuthForm;
