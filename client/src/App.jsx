import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

const ProtectedRoute = ({ children }) => {
    const { user } = useSocket();
    // If no user, redirect to Welcome
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children;
};

const AppRoutes = () => {
    const { user } = useSocket();

    return (
        <Routes>
            <Route path="/" element={!user ? <Welcome /> : <Navigate to="/chat" />} />
            <Route path="/guest" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <MainHandler />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

const MainHandler = () => {
    const { user } = useSocket();
    const [inSession, setInSession] = React.useState(false);

    const onStart = () => {
        setInSession(true);
    };

    return inSession ? <Chat onLeave={() => setInSession(false)} /> : <Home onStart={onStart} />;
};

function App() {
    return (
        <SocketProvider>
            <Router>
                <AppRoutes />
            </Router>
        </SocketProvider>
    );
}

export default App;
