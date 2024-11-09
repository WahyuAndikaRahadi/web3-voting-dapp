import React from 'react';
const PageHome = () => {
  return (
    <>
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            The Future of Digital Democracy
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Secure, transparent, and immutable voting system powered by blockchain technology.
            Take control of your voice in the digital age.
          </p>
          <a  href='/voting' className="bg-gradient-to-r from-teal-500 to-blue-500 px-8 py-4 rounded-lg font-medium text-lg hover:shadow-lg hover:shadow-teal-500/20 transition-all">
            Start Voting →
          </a>
        </div>
      </div>

      <div className="py-20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose TiedVote?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              emoji="🔒"
              title="Secure Voting"
              description="Enhanced security through blockchain technology and cryptographic protocols"
            />
            <FeatureCard 
              emoji="👁"
              title="Full Transparency"
              description="Every vote is recorded on the blockchain, ensuring complete transparency"
            />
            <FeatureCard 
              emoji="📊"
              title="Real-time Results"
              description="Watch the voting progress in real-time with instant result updates"
            />
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatCard number="100" label="Active Users" />
            <StatCard number="1000" label="Votes Cast" />
            <StatCard number="99.9%" label="Accuracy Rate" />
          </div>
        </div>
      </div>

      </div>
      </>
  )
}
const FeatureCard = ({ emoji, title, description }) => (
  <div className="p-6 rounded-xl border border-gray-800 hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/10 bg-black/20">
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center mb-4 text-2xl">
      {emoji}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const StatCard = ({ number, label }) => (
  <div className="p-6">
    <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-2">
      {number}
    </div>
    <div className="text-gray-400">{label}</div>
  </div>
);


export default PageHome
