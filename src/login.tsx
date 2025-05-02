import React, {useState, useContext} from 'react';
import axios from 'axios';
import { AuthContext } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useContext(AuthContext)!;
    const navigate = useNavigate();

    const [form, setForm] = useState({email: '', password: ''});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:5000/login', 
                new URLSearchParams({
                    username: form.email,
                    password: form.password
                }),
                {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });
            const token = response.data.access_token;
            login(token);
            // localStorage.setItem('token', token);
            console.log('Token:', token)
            alert("Logged in!");
            navigate('/saved-lists')
        } catch (error) {
            alert("Login failed!");
        }
    };

    return (
       <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input name="email" onChange={handleChange} placeholder='Email' type="email" required />
        <input name="password" onChange={handleChange} placeholder='Password' type='password' required/>
        <button type="submit">Login</button>
       </form> 
    );
};

export default Login;