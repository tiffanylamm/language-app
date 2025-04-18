import React, {createContext, useState, useEffect, ReactNode} from 'react';

interface AuthContextType {
    user: string | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children:ReactNode}) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);

            const payload = JSON.parse(atob(token.split(".")[1]));
            setUser(payload.sub);
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null)
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout}}>
            {children}
        </AuthContext.Provider>
    )

}