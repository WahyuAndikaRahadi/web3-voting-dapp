import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Vote, Users, Power, Shield, Clock, ChevronRight, Award, AlertTriangle, UserX, UserCheck, PlusCircle, Play, StopCircle } from 'lucide-react';
import { contractABI, contractAddress } from '../constant';

const PageVoting = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);
  const [newCandidate, setNewCandidate] = useState({ name: '', description: '' });
  const [votingDuration, setVotingDuration] = useState(60);
  const [voterInfo, setVoterInfo] = useState(null);
  const [votingPowerInput, setVotingPowerInput] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [votingResults, setVotingResults] = useState(null);
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [votingStatus, setVotingStatus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initContract = async () => {
      try {
        if (typeof window.ethereum === 'undefined') {
          throw new Error('Please install MetaMask');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const currentAccount = accounts[0];

        const signer = await provider.getSigner();
        const votingContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        setContract(votingContract);
        setAccount(currentAccount);

        // Check admin status for the current account
        const admin = await votingContract.admin();
        const isCurrentAdmin = currentAccount.toLowerCase() === admin.toLowerCase();
        setIsAdmin(isCurrentAdmin);

        // Load emergency stop status
        const stopStatus = await votingContract.emergencyStop();
        setEmergencyStop(stopStatus);

        // Load candidate and voting data
        await Promise.all([
          loadCandidates(votingContract),
          loadVoterInfo(votingContract, currentAccount),
          loadVotingResults(votingContract),
          checkVotingStatus(votingContract),
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Init contract error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initContract();
  }, []);

  const loadCandidates = async (votingContract) => {
    try {
      const count = await votingContract.getCandidatesCount();
      const candidatesList = [];

      for (let i = 0; i < count; i++) {
        const [id, name, description, votes] = await votingContract.getCandidate(i);
        candidatesList.push({
          id: Number(id),
          name,
          description,
          votes: Number(votes),
        });
      }

      setCandidates(candidatesList);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Error loading candidates');
    }
  };

  const loadVotingResults = async (votingContract) => {
    try {
      const [totalVotes, voteCounts] = await votingContract.getVotingResults();
      setVotingResults({
        totalVotes: Number(totalVotes),
        voteCounts: voteCounts.map((count) => Number(count)),
      });
    } catch (err) {
      console.error('Error loading voting results:', err);
      setError('Error loading voting results');
    }
  };

  const loadVoterInfo = async (votingContract, voterAddr) => {
    try {
      const [hasVoted, votedCandidateId, votingPower, isBlacklisted] =
        await votingContract.getVoterInfo(voterAddr);

      setVoterInfo({
        hasVoted,
        votedCandidateId: Number(votedCandidateId),
        votingPower: Number(votingPower),
        isBlacklisted,
      });
    } catch (err) {
      console.error('Error loading voter info:', err);
      setError('Failed to load voter information');
    }
  };

  const checkVotingStatus = async (votingContract) => {
    try {
      const time = await votingContract.getRemainingTime();
      setRemainingTime(Number(time));

      // Update voting status based on time and emergency stop
      const isActive = Number(time) > 0 && !emergencyStop;
      setVotingStatus(isActive);

      if (isActive && !emergencyStop) {
        setTimeout(() => checkVotingStatus(votingContract), 1000);
      } else if (Number(time) === 0) {
        setVotingStatus(false);
        await resetVotingState(votingContract);
      }
    } catch (err) {
      console.error('Error checking voting status:', err);
      setError('Error checking voting status');
    }
  };

  const resetVotingState = async (votingContract) => {
    try {
      // Reset the voting state
      await votingContract.resetVotingState();

      // Reload data after reset
      await Promise.all([
        loadVoterInfo(votingContract, account),
        loadCandidates(votingContract),
        loadVotingResults(votingContract),
        checkVotingStatus(votingContract),
      ]);
    } catch (err) {
      console.error('Error resetting voting state:', err);
      setError('Error resetting voting state');
    }
  };

  

  const handleStartVoting = async () => {
    try {
      if (!contract || !isAdmin) {
        setError('Not authorized');
        return;
      }

      if (votingDuration <= 0) {
        setError('Duration must be greater than 0');
        return;
      }

      if (emergencyStop) {
        setError('Please resume voting first');
        return;
      }

      await contract.startVoting(votingDuration);
      await checkVotingStatus(contract);
    } catch (err) {
      console.error('Start voting error:', err);
      setError(`Error starting voting: ${err.message}`);
    }
  };

  const handleVote = async (candidateId) => {
    try {
      if (!contract || !votingStatus) {
        setError('Voting is not in progress');
        return;
      }

      if (voterInfo?.isBlacklisted) {
        setError('You are blacklisted and cannot vote');
        return;
      }

      if (voterInfo?.hasVoted) {
        setError('You have already voted');
        return;
      }

      if (voterInfo?.votingPower < 1) {
        setError('You do not have sufficient voting power');
        return;
      }

      await contract.vote( candidateId, { gasLimit: 300000 });
      await loadVoterInfo(contract, account);
      await loadVotingResults(contract);
    } catch (err) {
      console.error('Vote error:', err);
      setError(`Error voting: ${err.message}`);
    }
  };

  const handleRevokeVote = async () => {
    try {
      if (!contract || !votingStatus) {
        setError('Voting is not in progress');
        return;
      }

      if (!voterInfo?.hasVoted) {
        setError('You have not voted yet');
        return;
      }

      await contract.revokeVote();
      await loadVoterInfo(contract, account);
      await loadVotingResults(contract);
    } catch (err) {
      console.error('Revoke vote error:', err);
      setError(`Error revoking vote: ${err.message}`);
    }
  };

  const handleAssignVotingPower = async () => {
    try {
      if (!contract || !isAdmin || !votingStatus) {
        setError('Not authorized or voting is in progress');
        return;
      }

      if (!voterAddress || !votingPowerInput) {
        setError('Voter address and voting power are required');
        return;
      }

      await contract.assignVotingPower(voterAddress, votingPowerInput);
      setVoterAddress('');
      setVotingPowerInput('');
    } catch (err) {
      console.error('Assign voting power error:', err);
      setError(`Error assigning voting power: ${err.message}`);
    }
  };

  const handleToggleEmergencyStop = async () => {
    try {
      if (!contract || !isAdmin) {
        setError('Not authorized');
        return;
      }

      await contract.toggleEmergencyStop();
      const newStopStatus = await contract.emergencyStop();
      setEmergencyStop(newStopStatus);

      if (!newStopStatus) {
        await checkVotingStatus(contract);
      } else {
        setVotingStatus(false);
      }
    } catch (err) {
      console.error('Emergency stop error:', err);
      setError(`Error toggling emergency stop: ${err.message}`);
    }
  };

  const handleSetBlacklist = async (blacklisted) => {
    try {
      if (!contract || !isAdmin || !votingStatus) {
        setError('Not authorized or voting is in progress');
        return;
      }

      if (!blacklistAddress) {
        setError('Voter address is required');
        return;
      }

      await contract.setVoterBlacklist(blacklistAddress, blacklisted);
      setBlacklistAddress('');
    } catch (err) {
      console.error('Blacklist update error:', err);
      setError(`Error updating blacklist: ${err.message}`);
    }
  };

  const handleAddCandidate = async () => {
    try {
      // Debug logs
      console.log('Current Contract State:', {
        isAdmin,
        votingStarted: votingStatus,
        emergencyStop,
        contract: !!contract
      });
  
      // Validasi dasar
      if (!contract) {
        setError('Contract connection not established');
        return;
      }
  
      if (!isAdmin) {
        setError('Only admin can add candidates');
        return;
      }
  
      // Periksa status voting secara eksplisit dari smart contract
      const remainingTimeValue = await contract.getRemainingTime();
      const votingStartedStatus = remainingTimeValue > 0;
      console.log('Voting Status Check:', {
        remainingTime: Number(remainingTimeValue),
        votingStarted: votingStartedStatus
      });
  
      if (votingStartedStatus) {
        setError('Cannot add candidates while voting is in progress');
        return;
      }
  
      // Validasi input
      if (!newCandidate.name.trim() || !newCandidate.description.trim()) {
        setError('Candidate name and description are required');
        return;
      }
  
      setLoading(true);
      setError('');
  
      // Kirim transaksi dengan parameter yang lengkap
      const tx = await contract.addCandidate(
        newCandidate.name.trim(),
        newCandidate.description.trim(),
        {
          gasLimit: 300000,
          from: account // explicit sender
        }
      );
  
      console.log('Transaction sent:', tx.hash);
      
      // Tunggu konfirmasi
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
  
      // Cek event dari receipt
      const addEvent = receipt.events?.find(
        (e) => e.event === 'CandidateAdded'
      );
      if (addEvent) {
        console.log('Candidate added successfully:', addEvent.args);
        setError('Candidate added successfully!');
      }
  
      // Reset form dan reload data
      setNewCandidate({ name: '', description: '' });
      await loadCandidates(contract);
  
    } catch (err) {
      console.error('Add candidate error:', err);
      
      // Error handling yang lebih spesifik
      if (err.message.includes('VotingAlreadyStarted')) {
        setError('Cannot add candidate: Voting has already started');
      } else if (err.message.includes('OnlyAdmin')) {
        setError('Only admin can add candidates');
      } else {
        setError(`Failed to add candidate: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Tambahkan ini di useEffect untuk memonitor status kontrak
  useEffect(() => {
    const checkContractStatus = async () => {
      if (!contract) return;
      
      try {
        const [remainingTime, votingStarted] = await Promise.all([
          contract.getRemainingTime(),
          contract.votingStarted()
        ]);
  
        console.log('Contract Status:', {
          remainingTime: Number(remainingTime),
          votingStarted,
          emergencyStop,
          isAdmin
        });
      } catch (err) {
        console.error('Error checking contract status:', err);
      }
    };
  
    checkContractStatus();
  }, [contract, isAdmin]);


  const isVotingInactive = !votingStatus;
  const isEmergencyStopped = emergencyStop;
  const hasNoVotingPower = voterInfo?.votingPower <= 0;
  const isBlacklisted = voterInfo?.isBlacklisted;
  const hasVoted = voterInfo?.hasVoted;

  const cannotAddCandidate = !isAdmin || votingStatus || (isEmergencyStopped && remainingTime > 0);
  const cannotStartVoting = !isAdmin || votingStatus || (isEmergencyStopped && remainingTime > 0);
  const cannotAssignPower = !isAdmin || (isEmergencyStopped && remainingTime > 0);
  const cannotManageBlacklist = !isAdmin || (isEmergencyStopped && remainingTime > 0);
  const cannotVote = isVotingInactive || isEmergencyStopped || hasNoVotingPower || isBlacklisted || hasVoted;
  const cannotRevokeVote = isVotingInactive || isEmergencyStopped || !hasVoted;


  const renderCandidates = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => (
        <div key={candidate.id} className="border border-gray-600 rounded-lg p-4 bg-gray-800 shadow-sm">
          <h3 className="font-medium text-lg text-white mb-2">{candidate.name}</h3>
          <p className="text-gray-400 mb-4">{candidate.description}</p>
          <button
            onClick={() => handleVote(candidate.id)}
            disabled={cannotVote}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Vote
          </button>
        </div>
      ))}
    </div>
  );
  


  const renderVotingResults = () => {
    if (!votingResults) return null;
  
    // Membentuk data untuk chart
    const data = candidates.map((candidate, index) => ({
      name: candidate.name,
      value: candidate.votes,
    }));
  
    // Warna untuk setiap segmen di pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9370DB', '#FF6347'];
  
    return (
      <div className="mb-6 p-6 border border-gray-700 rounded-lg bg-gray-800">
        <h3 className="font-semibold text-2xl text-gray-300 mb-4 text-center">
          Hasil Voting
        </h3>
        <p className="text-gray-400 text-lg text-center mb-6">
          Total Suara Masuk: <span className="font-bold text-white">{votingResults.totalVotes}</span>
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label={(entry) => `${entry.name} : Total Vote ${entry.value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#2d3748',
                border: 'none',
                borderRadius: '5px',
                color: '#fff',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };
  

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="flex space-x-2 mb-4">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce delay-150"></div>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-bounce delay-225"></div>
        </div>
        <div className="flex space-x-1">
          {['L', 'o', 'a', 'd', 'i', 'n', 'g', '.', '.', '.'].map((char, index) => (
            <span
              key={index}
              className="text-lg text-white font-semibold animate-wave"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {char}
            </span>
          ))}
        </div>
        <style>
          {`
            .animate-wave {
              display: inline-block;
              animation: wave 1.5s ease-in-out infinite;
            }
            @keyframes wave {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vote className="w-10 h-10 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">Voting Portal</h1>
            </div>
            {emergencyStop && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-500 font-medium">Emergency Stop Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Voter Information
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Connected Account</p>
                  <p className="text-white font-mono overflow-hidden">{account}</p>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time Remaining
                  </p>
                  <p className="text-white text-2xl font-bold">
                    {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
                  </p>
                </div>

                {voterInfo && (
                  <>
                    <div className="bg-gray-900/50 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <Power className="w-4 h-4" />
                        Voting Power
                      </p>
                      <p className="text-white text-2xl font-bold">{voterInfo.votingPower}</p>
                    </div>

                    <div className="bg-gray-900/50 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Status
                      </p>
                      <div className="mt-2">
                        {voterInfo.isBlacklisted ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm font-medium">
                            <UserX className="w-4 h-4" /> Blacklisted
                          </span>
                        ) : voterInfo.hasVoted ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                            <UserCheck className="w-4 h-4" /> Voted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm font-medium">
                            <ChevronRight className="w-4 h-4" /> Not Voted
                          </span>
                        )}
                      </div>
                    </div>

                    {voterInfo.hasVoted && (
                      <button
                        onClick={handleRevokeVote}
                        disabled={cannotRevokeVote}
                        className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <StopCircle className="w-5 h-5" />
                        Revoke Vote
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Middle & Right Columns - Admin Controls & Voting */}
          <div className="lg:col-span-2 space-y-6">
            {/* Admin Controls */}
            {isAdmin && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Admin Controls
                </h2>

                <div className="space-y-6">
                  {/* Add Candidate */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400">Add New Candidate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                        placeholder="Candidate Name"
                        className="px-4 py-3 bg-gray-900/50 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={newCandidate.description}
                        onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                        placeholder="Candidate Description"
                        className="px-4 py-3 bg-gray-900/50 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleAddCandidate}
                      disabled={cannotAddCandidate}
                      className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Add Candidate
                    </button>
                  </div>

                  {/* Voting Controls */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400">Voting Controls</h3>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={votingDuration}
                        onChange={(e) => setVotingDuration(parseInt(e.target.value))}
                        placeholder="Duration (minutes)"
                        min="1"
                        className="flex-1 px-4 py-3 bg-gray-900/50 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleStartVoting}
                        disabled={cannotStartVoting}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Start
                      </button>
                    </div>
                  </div>

                  {/* Voter Management */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400">Voter Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={voterAddress}
                        onChange={(e) => setVoterAddress(e.target.value)}
                        placeholder="Voter Address"
                        className="px-4 py-3 bg-gray-900/50 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={votingPowerInput}
                        onChange={(e) => setVotingPowerInput(e.target.value)}
                        placeholder="Voting Power"
                        min="1"
                        className="px-4 py-3 bg-gray-900/50 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleAssignVotingPower}
                      disabled={cannotAssignPower}
                      className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Power className="w-5 h-5" />
                      Assign Power
                    </button>
                  </div>

                  {/* Blacklist Controls */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400">Blacklist Management</h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={blacklistAddress}
                        onChange={(e) => setBlacklistAddress(e.target.value)}
                        placeholder="Voter Address"
                        className="flex-1 px-4 py-3 bg-gray-900/50 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSetBlacklist(true)}
                        disabled={cannotManageBlacklist}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        Blacklist
                      </button>
                      <button
                        onClick={() => handleSetBlacklist(false)}
                        className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                      >
                        Unblock
                      </button>
                    </div>
                  </div>

                  {/* Emergency Stop */}
                  <button
                    onClick={handleToggleEmergencyStop}
                    className={`w-full px-4 py-3 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2
                      ${emergencyStop 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-red-500 hover:bg-red-600'
                      }`}
                  >
                    {emergencyStop ? (
                      <>
                        <Play className="w-5 h-5" />
                        Resume Voting
                      </>
                    ) : (
                      <>
                        <StopCircle className="w-5 h-5" />
                        Emergency Stop
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Voting Results */}
            {votingResults && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  Voting Results
                </h2>
                <div className="space-y-4">
                  {renderVotingResults()}
                </div>
              </div>
            )}

            {/* Candidates List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Candidates
              </h2>
              <div className="space-y-4">
                {renderCandidates()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default PageVoting;