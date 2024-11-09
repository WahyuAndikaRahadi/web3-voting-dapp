import React from 'react';
import { Lock, Shield, Check, Clock, Database, FileText } from 'lucide-react';

const PageAbout = () => {
  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black">
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            TiedVote
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            The next-generation voting platform powered by blockchain technology. Our mission is to provide a secure, transparent, and efficient way for communities to make collective decisions.
          </p>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          What We Do
        </h2>
        <div className="bg-gray-900 rounded-lg p-8 backdrop-blur-lg bg-opacity-50 border border-gray-800">
          <p className="text-lg text-gray-300">
            At TiedVote, we empower administrators to create polls and assign voting power to users. Whether it's for community decisions, organizational votes, or any other type of poll, our platform ensures that every vote counts and is accurately recorded.
          </p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Benefits of Using Our Platform
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: <Shield className="w-8 h-8 text-blue-400" />, title: "Security", description: "Our platform leverages blockchain technology to ensure that all votes are securely recorded and cannot be tampered with." },
            { icon: <FileText className="w-8 h-8 text-purple-400" />, title: "Transparency", description: "Every vote is publicly verifiable on the blockchain, providing complete transparency in the voting process." },
            { icon: <Clock className="w-8 h-8 text-blue-400" />, title: "Efficiency", description: "Our user-friendly interface makes it easy for administrators to set up polls and for users to cast their votes quickly and easily." },
            { icon: <Lock className="w-8 h-8 text-purple-400" />, title: "Trust", description: "By using blockchain, we eliminate the need for a central authority, ensuring that the voting process is fair and unbiased." }
          ].map((benefit, index) => (
            <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-gray-700 transition-all">
              <div className="flex items-center mb-4">
                {benefit.icon}
                <h3 className="text-xl font-bold ml-3 text-gray-100">{benefit.title}</h3>
              </div>
              <p className="text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Blockchain Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Blockchain Integration
        </h2>
        <div className="bg-gray-900 rounded-lg p-8 mb-12 border border-gray-800">
          <p className="text-gray-300 text-lg">
            Blockchain technology is at the heart of our platform. By recording votes on a decentralized ledger, we ensure that the voting process is secure, transparent, and immutable. This means that once a vote is cast, it cannot be altered or deleted, providing a high level of trust and integrity in the results.
          </p>
        </div>

        <h3 className="text-2xl font-bold mb-6 text-gray-100">Why Blockchain?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Database className="w-6 h-6 text-blue-400" />, title: "Immutability", description: "Once data is recorded on the blockchain, it cannot be changed, ensuring the integrity of the voting process." },
            { icon: <Check className="w-6 h-6 text-purple-400" />, title: "Decentralization", description: "Blockchain eliminates the need for a central authority, reducing the risk of manipulation and fraud." },
            { icon: <FileText className="w-6 h-6 text-blue-400" />, title: "Transparency", description: "All transactions on the blockchain are publicly verifiable, providing complete transparency in the voting process." }
          ].map((feature, index) => (
            <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-gray-700 transition-all">
              <div className="flex items-center mb-4">
                {feature.icon}
                <h4 className="text-lg font-bold ml-2 text-gray-100">{feature.title}</h4>
              </div>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageAbout;