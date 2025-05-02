import React, {useState} from 'react'
import axios from 'axios';
import {useNavigate} from 'react-router-dom'

const Register = () => {
    const [form, setForm] = useState({email: '', password: ''});
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:5000/register', form);
            alert(response.data.message);
            navigate("/login");
        } catch (error) {
            alert("Registration failed")
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded shadow-md w-full max-w-sm flex flex-col items-center gap-4"
          >
            <h2 className="text-2xl font-bold text-center mb-4">Register</h2>
      
            <input
              name="email"
              onChange={handleChange}
              placeholder="Email"
              type="email"
              required
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
      
            <input
              name="password"
              onChange={handleChange}
              placeholder="Password"
              type="password"
              required
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
      
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200"
            >
              Register
            </button>
          </form>
        </div>
      );      
};

export default Register;