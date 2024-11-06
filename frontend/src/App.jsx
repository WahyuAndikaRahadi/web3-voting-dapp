import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PageHome from './pages/PageHome';
import PageAbout from './pages/PageAbout';
import PageVoting from './pages/PageVoting';
import PageContact from './pages/PageContact';

const App = () => {
    return (
        <Router>
            <nav class="bg-gray-800 shadow-lg p-4">
                <div class="container mx-auto px-4">
                    <ul class="flex space-x-4 pl-auto">
                        <li><Link to="/" class="text-gray-100 hover:text-gray-300">Home</Link></li>
                        <li><Link to="/about" class="text-gray-100 hover:text-gray-300">About</Link></li>
                        <li><Link to="/voting" class="text-gray-100 hover:text-gray-300">Voting</Link></li>
                        <li><Link to="/contact" class="text-gray-100 hover:text-gray-300">Contact</Link></li>
                    </ul>
                </div>
            </nav>



            <Routes>
                <Route path="/" element={<PageHome />} />
                <Route path="/about" element={<PageAbout />} />
                <Route path="/voting" element={<PageVoting />} />
                <Route path="/contact" element={<PageContact />} />
            </Routes>
        </Router>

    );
};

export default App;
