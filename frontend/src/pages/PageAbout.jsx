import React from 'react';

const PageAbout = () => {
  return (

    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="">
        <h1 className="text-4xl font-extrabold mb-6 text-blue-400">About Us</h1>
        <p className="mb-6 text-lg">
          Welcome to <strong>[Your Website Name]</strong>, the next-generation voting platform powered by blockchain technology. Our mission is to provide a secure, transparent, and efficient way for communities to make collective decisions.
        </p>
      </div>
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-6xl mt-10 w-full">

        <h2 className="text-3xl font-semibold mb-4 text-blue-400">What We Do</h2>
        <p className="mb-6 text-lg">
          At <strong>[Your Website Name]</strong>, we empower administrators to create polls and assign voting power to users. Whether it's for community decisions, organizational votes, or any other type of poll, our platform ensures that every vote counts and is accurately recorded.
        </p>
        <h2 className="text-3xl font-semibold mb-4 text-blue-400">Benefits of Using Our Platform</h2>
        <ul className="list-disc list-inside mb-6 text-lg">
          <li className="mb-2"><strong>Security</strong>: Our platform leverages blockchain technology to ensure that all votes are securely recorded and cannot be tampered with.</li>
          <li className="mb-2"><strong>Transparency</strong>: Every vote is publicly verifiable on the blockchain, providing complete transparency in the voting process.</li>
          <li className="mb-2"><strong>Efficiency</strong>: Our user-friendly interface makes it easy for administrators to set up polls and for users to cast their votes quickly and easily.</li>
          <li className="mb-2"><strong>Trust</strong>: By using blockchain, we eliminate the need for a central authority, ensuring that the voting process is fair and unbiased.</li>
        </ul>
        <h2 className="text-3xl font-semibold mb-4 text-blue-400">Blockchain Integration</h2>
        <p className="mb-6 text-lg">
          Blockchain technology is at the heart of our platform. By recording votes on a decentralized ledger, we ensure that the voting process is secure, transparent, and immutable. This means that once a vote is cast, it cannot be altered or deleted, providing a high level of trust and integrity in the results.
        </p>
        <h2 className="text-3xl font-semibold mb-4 text-blue-400">Why Blockchain?</h2>
        <ul className="list-disc list-inside mb-6 text-lg">
          <li className="mb-2"><strong>Immutability</strong>: Once data is recorded on the blockchain, it cannot be changed, ensuring the integrity of the voting process.</li>
          <li className="mb-2"><strong>Decentralization</strong>: Blockchain eliminates the need for a central authority, reducing the risk of manipulation and fraud.</li>
          <li className="mb-2"><strong>Transparency</strong>: All transactions on the blockchain are publicly verifiable, providing complete transparency in the voting process.</li>
        </ul>
        <p className="text-lg">
          Join us at <strong>[Your Website Name]</strong> and be part of a revolution in how decisions are made. Your vote matters, and with our platform, you can be confident that it is counted accurately and securely.
        </p>
      </div>
    </div>
  );
};

export default PageAbout;
