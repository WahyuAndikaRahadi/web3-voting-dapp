import React from 'react'

const Navbar = () => {
    return (
        <nav className="bg-transparent shadow-lg p-4">
            <div className="container mx-auto px-4">
                <ul className="flex space-x-4 ml-auto">
                    <li><Link to="/" className="text-gray-100 hover:text-gray-300">Home</Link></li>
                    <li><Link to="/about" className="text-gray-100 hover:text-gray-300">About</Link></li>
                    <li><Link to="/voting" className="text-gray-100 hover:text-gray-300">Voting</Link></li>
                    <li><Link to="/contact" className="text-gray-100 hover:text-gray-300">Contact</Link></li>
                </ul>
            </div>
        </nav>
    )
}

export default Navbar
