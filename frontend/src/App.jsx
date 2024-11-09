import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PageHome from './pages/PageHome';
import PageAbout from './pages/PageAbout';
import PageVoting from './pages/PageVoting';
import PageContact from './pages/PageContact';

const App = () => {
    return (
        <Router>
            <header className='bg-gray-800'>
                <div className="mx-auto max-w-screen-lg py-1 flex items-center justify-between">
                    <a className='flex items-center text-2xl text-white font-bold' href="">
                        <span></span>
                        <span>TiedVote</span>
                        </a>
                    <nav className=" shadow-lg p-4">
                        <ul className="flex md:gap-x-8">
                            <li><Link to="/" className="text-gray-100 hover:text-gray-300">Home</Link></li>
                            <li><Link to="/about" className="text-gray-100 hover:text-gray-300">About</Link></li>
                            <li><Link to="/voting" className="text-gray-100 rounded-xl hover:bg-white hover:text-gray-800 border-gray-100 border-2 px-6 py-2 transition ease-in-out font-semibold">Voting</Link></li>
                            <li><Link to="/contact" className="text-gray-100 hover:text-gray-300 ">Contact</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>



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
