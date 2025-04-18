import React, {useState} from 'react'
import axios from 'axios';

const Register = () => {
    const [form, setForm] = useState({email: '', password: ''});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:5000/register', form);
            alert(response.data.message);
        } catch (error) {
            alert("Registration failed")
        }
    };

    return (
        <form onSubmit={handleSubmit} className='flex flex gap-4'>
            <input name="email" onChange={handleChange} placeholder='Email' type='email' required/>
            <input name="password" onChange={handleChange} placeholder='Password' type="password" required/>
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;