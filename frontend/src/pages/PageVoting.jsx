import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BrowserProvider, Contract } from 'ethers';
import { contractABI,contractAddress } from '../constant';

const PageVoting = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);
  const [error, setError] = useState('');

  // New state variables for additional features
  const [newCandidate, setNewCandidate] = useState({ name: '', description: '' });
  const [votingDuration, setVotingDuration] = useState(60);
  const [voterInfo, setVoterInfo] = useState(null);
  const [votingPowerInput, setVotingPowerInput] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [votingResults, setVotingResults] = useState(null);
  const [blacklistAddress, setBlacklistAddress] = useState('');

  const initContract = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask');
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const currentAccount = accounts[0];
      setAccount(currentAccount);

      const signer = await provider.getSigner();
      const votingContract = new Contract(
        contractAddress,
        contractABI,
        signer
      );

      setContract(votingContract);

      // Load voter info immediately after contract initialization
      const [hasVoted, votedCandidateId, votingPower, isBlacklisted] = 
        await votingContract.getVoterInfo(currentAccount);
      
      setVoterInfo({
        hasVoted,
        votedCandidateId: Number(votedCandidateId),
        votingPower: Number(votingPower),
        isBlacklisted
      });

      const admin = await votingContract.admin();
      setIsAdmin(currentAccount.toLowerCase() === admin.toLowerCase());

      const stopStatus = await votingContract.emergencyStop();
      setEmergencyStop(stopStatus);

      return votingContract;
    } catch (err) {
      console.error('Init contract error:', err);
      setError(err.message);
      throw err;
    }
  };


  const loadCandidates = async (votingContract) => {
    try {
      if (!votingContract) return;

      const count = await votingContract.getCandidatesCount();
      const candidatesList = [];

      for (let i = 0; i < count; i++) {
        const [id, name, description, votes] = await votingContract.getCandidate(i);
        candidatesList.push({
          id: Number(id),
          name,
          description,
          votes: Number(votes)
        });
      }

      setCandidates(candidatesList);

      // Load voting results
      const [totalVotes, voteCounts] = await votingContract.getVotingResults();
      setVotingResults({ totalVotes: Number(totalVotes), voteCounts });
    } catch (err) {
      setError('Error loading candidates');
      console.error(err);
    }
  };

  const loadVoterInfo = async (votingContract, voterAddress) => {
    try {
      if (!votingContract || !voterAddress) {
        console.warn('Missing contract or voter address');
        return;
      }

      console.log('Loading voter info for:', voterAddress);
      const [hasVoted, votedCandidateId, votingPower, isBlacklisted] = 
        await votingContract.getVoterInfo(voterAddress);
      
      const voterInfoData = {
        hasVoted,
        votedCandidateId: Number(votedCandidateId),
        votingPower: Number(votingPower),
        isBlacklisted
      };
      
      console.log('Voter info loaded:', voterInfoData);
      setVoterInfo(voterInfoData);
    } catch (err) {
      console.error('Error loading voter info:', err);
      setError('Failed to load voter information');
    }
  };


  const updateRemainingTime = async (votingContract) => {
    try {
      if (!votingContract) return;

      const time = await votingContract.getRemainingTime();
      setRemainingTime(Number(time));

      if (Number(time) > 0) {
        setTimeout(() => updateRemainingTime(votingContract), 1000);
      }
    } catch (err) {
      setError('Error updating remaining time');
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const votingContract = await initContract();
        
        // Load all necessary data
        await Promise.all([
          loadCandidates(votingContract),
          updateRemainingTime(votingContract),
          loadVoterInfo(votingContract, account)
        ]);

        votingContract.on('VoteCasted', async (voter, candidateId, votingPower) => {
          await loadCandidates(votingContract);
          await loadVoterInfo(votingContract, account);
        });


        // Set up event listeners
        votingContract.on('VoteCasted', (voter, candidateId, votingPower) => {
          loadCandidates(votingContract);
          loadVoterInfo(votingContract, account);
        });

        votingContract.on('CandidateAdded', (candidateId, name, addedBy) => {
          loadCandidates(votingContract);
        });

        votingContract.on('VotingStarted', (endTime) => {
          updateRemainingTime(votingContract);
        });

        votingContract.on('VotingPowerAssigned', (voter, power) => {
          loadVoterInfo(votingContract, voter);
        });

        votingContract.on('EmergencyStopToggled', (stopped) => {
          setEmergencyStop(stopped);
        });

        votingContract.on('VoterBlacklistUpdated', (voter, blacklisted) => {
          loadVoterInfo(votingContract, voter);
        });

        votingContract.on('VoteRevoked', (voter, candidateId) => {
          loadCandidates(votingContract);
          loadVoterInfo(votingContract, voter);
        });

setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, []);
  
useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0 && accounts[0] !== account) {
        setAccount(accounts[0]);
        if (contract) {
          await loadVoterInfo(contract, accounts[0]);
        }
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [contract, account]);

  const checkNetwork = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      // Pastikan network yang benar (misal: localhost 31337 untuk Hardhat)
      if (network.chainId !== 31337n) {
        throw new Error('Please connect to the correct network (Localhost 31337)');
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // 2. Fungsi untuk memeriksa saldo
  const checkBalance = async (address) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      if (balance.toString() === '0') {
        throw new Error('Insufficient funds for transaction');
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // 3. Fungsi untuk memperkirakan gas
  const estimateGas = async (transaction) => {
    try {
      const gasEstimate = await transaction.estimateGas();
      return gasEstimate;
    } catch (err) {
      throw new Error('Failed to estimate gas. Contract may be reverting.');
    }
  };

  const handleTransactionError = (error) => {
    let errorMessage = 'An error occurred';

    if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for transaction';
    } else if (error.code === -32603) {
        if (error.message.includes('execution reverted')) {
            const match = error.message.match(/reverted with reason string '(.+)'/);
            errorMessage = match ? match[1].trim() : 'Transaction failed in contract';
        }
    } else if (error.message.includes('gas')) {
        errorMessage = 'Gas estimation failed. Transaction may fail.';
    } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
    }

    setError(errorMessage);
    console.error('Detailed error:', error);
};


  // 5. Enhanced transaction executor
  const executeTransaction = async (transactionFunc, preChecks = true) => {
    try {
      // Pre-transaction checks
      if (preChecks) {
        const networkOk = await checkNetwork();
        if (!networkOk) return;

        const balanceOk = await checkBalance(account);
        if (!balanceOk) return;
      }

      // Prepare transaction
      const transaction = await transactionFunc();

      // Estimate gas
      try {
        await estimateGas(transaction);
      } catch (err) {
        throw new Error('Transaction will likely fail. Please check your inputs.');
      }

      // Execute transaction
      setError('Transaction pending... Please wait');
      const receipt = await transaction.wait();
      setError('');

      return receipt;
    } catch (error) {
      handleTransactionError(error);
      throw error;
    }
  };


  const handleAddCandidate = async () => {
    try {
      if (!contract) {
        setError('Contract not initialized');
        return;
      }

      // Validasi input
      if (!newCandidate.name.trim() || !newCandidate.description.trim()) {
        setError('Candidate name and description are required');
        return;
      }

      // Check admin status
      if (!isAdmin) {
        setError('Only admin can add candidates');
        return;
      }

      await executeTransaction(
        () => contract.addCandidate(newCandidate.name, newCandidate.description)
      );

      setNewCandidate({ name: '', description: '' });
      await loadCandidates(contract);

    } catch (err) {
      console.error('Add candidate error:', err);
    }
  };


  const handleStartVoting = async () => {
    try {
      if (!contract) return;
      setError('');

      if (votingDuration <= 0) {
        throw new Error('Duration must be greater than 0');
      }

      const tx = await contract.startVoting(votingDuration);
      await tx.wait();
      await updateRemainingTime(contract);
    } catch (err) {
      setError(err.message || 'Error starting voting');
      console.error(err);
    }
  };

  const handleVote = async (candidateId) => {
    try {
      if (!contract) {
        setError('Contract not initialized');
        return;
      }

      if (!account) {
        setError('Please connect your wallet');
        return;
      }

      // Reload voter info before voting to ensure it's up to date
      await loadVoterInfo(contract, account);

      // Check if voter info is loaded
      if (!voterInfo) {
        console.log('Attempting to reload voter info...');
        await loadVoterInfo(contract, account);
        
        if (!voterInfo) {
          setError('Please wait while loading voter information');
          return;
        }
      }

      // Pre-validation checks
      if (voterInfo.hasVoted) {
        setError('You have already voted');
        return;
      }

      if (voterInfo.isBlacklisted) {
        setError('You are blacklisted from voting');
        return;
      }

      if (voterInfo.votingPower < 1) {
        setError('No voting power assigned. Please contact admin');
        return;
      }

      if (remainingTime === 0) {
        setError('Voting period has ended');
        return;
      }

      setError('Processing vote...');
      const tx = await contract.vote(candidateId);
      setError('Confirming transaction...');
      await tx.wait();

      // Refresh data after successful vote
      await loadCandidates(contract);
      await loadVoterInfo(contract, account);
      setError('');

    } catch (err) {
      console.error('Voting error:', err);
      handleTransactionError(err);
    }
  };


  const handleRevokeVote = async () => {
    try {
      if (!contract) return;
      setError('');

      const tx = await contract.revokeVote();
      await tx.wait();
      await loadCandidates(contract);
      await loadVoterInfo(contract, account);
    } catch (err) {
      setError(err.message || 'Error revoking vote');
      console.error(err);
    }
  };

  const handleAssignVotingPower = async () => {
    try {
      if (!contract || !isAdmin) return;
      setError('');

      if (!voterAddress || !votingPowerInput) {
        throw new Error('Voter address and voting power are required');
      }

      const tx = await contract.assignVotingPower(voterAddress, votingPowerInput);
      await tx.wait();
      await loadVoterInfo(contract, voterAddress);

      setVoterAddress('');
      setVotingPowerInput('');
    } catch (err) {
      setError(err.message || 'Error assigning voting power');
      console.error(err);
    }
  };

  const handleToggleEmergencyStop = async () => {
    try {
      if (!contract || !isAdmin) return;
      setError('');

      const tx = await contract.toggleEmergencyStop();
      await tx.wait();
    } catch (err) {
      setError(err.message || 'Error toggling emergency stop');
      console.error(err);
    }
  };

  const handleSetBlacklist = async (blacklisted) => {
    try {
      if (!contract || !isAdmin) return;
      setError('');

      if (!blacklistAddress) {
        throw new Error('Voter address is required');
      }

      const tx = await contract.setVoterBlacklist(blacklistAddress, blacklisted);
      await tx.wait();
      await loadVoterInfo(contract, blacklistAddress);

      setBlacklistAddress('');
    } catch (err) {
      setError(err.message || 'Error updating blacklist');
      console.error(err);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Error Display dengan status yang lebih detail */}
      {error && (
        <div className={`mb-4 p-4 rounded-lg ${error.includes('pending')
            ? 'bg-blue-50 border border-blue-200'
            : error.includes('rejected')
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
          <div className="flex items-center">
            {error.includes('pending') && (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span className={`${error.includes('pending')
                ? 'text-blue-700'
                : error.includes('rejected')
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
              {error}
            </span>
          </div>
        </div>

      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800">Voting dApp</h2>
            {emergencyStop && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                Emergency Stop Active
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
          {/* Account & Voter Info */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium text-gray-700">
                Connected Account: <span className="text-gray-900">{account}</span>
              </p>
              <p className="font-medium text-gray-700">
                Time Remaining: <span className="text-gray-900">
                  {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
                </span>
              </p>
            </div>
            {voterInfo && (
              <div className="space-y-2">
                <p className="font-medium text-gray-700">
                  Voting Power: <span className="text-gray-900">{voterInfo.votingPower}</span>
                </p>
                <p className="font-medium text-gray-700">
                  Status: {voterInfo.isBlacklisted ? (
                    <span className="text-red-600">Blacklisted</span>
                  ) : voterInfo.hasVoted ? (
                    <span className="text-green-600">Voted</span>
                  ) : (
                    <span className="text-blue-600">Not Voted</span>
                  )}
                </p>
                {voterInfo.hasVoted && (
                  <button
                    onClick={handleRevokeVote}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Revoke Vote
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-800">Admin Controls</h3>

              {/* Add Candidate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  placeholder="Candidate Name"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newCandidate.description}
                  onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                  placeholder="Candidate Description"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleAddCandidate}
                  className="md:col-span-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Candidate
                </button>
              </div>

              {/* Start Voting */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={votingDuration}
                  onChange={(e) => setVotingDuration(parseInt(e.target.value))}
                  placeholder="Duration (minutes)"
                  min="1"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleStartVoting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Voting
                </button>
              </div>

              {/* Assign Voting Power */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={voterAddress}
                  onChange={(e) => setVoterAddress(e.target.value)}
                  placeholder="Voter Address"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  value={votingPowerInput}
                  onChange={(e) => setVotingPowerInput(e.target.value)}
                  placeholder="Voting Power"
                  min="1"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleAssignVotingPower}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Power
                </button>
              </div>

              {/* Blacklist Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={blacklistAddress}
                  onChange={(e) => setBlacklistAddress(e.target.value)}
                  placeholder="Voter Address"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => handleSetBlacklist(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Blacklist
                </button>
                <button
                  onClick={() => handleSetBlacklist(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Remove from Blacklist
                </button>
              </div>

              {/* Emergency Stop */}
              <button
                onClick={handleToggleEmergencyStop}
                className={`w-full px-4 py-2 rounded-lg text-white
                  ${emergencyStop
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {emergencyStop ? 'Resume Voting' : 'Emergency Stop'}
              </button>
            </div>
          )}

          {/* Voting Results */}
          {votingResults && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-2">Voting Results</h3>
              <p className="text-gray-700">
                Total Votes Cast: <span className="font-medium">{votingResults.totalVotes}</span>
              </p>
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
              >
                <h3 className="font-medium text-lg text-gray-800 mb-2">
                  {candidate.name}
                </h3>
                <p className="text-gray-600 mb-2">{candidate.description}</p>
                <p className="text-gray-600 mb-4">
                  Votes: <span className="font-medium">{candidate.votes}</span>
                  {votingResults && (
                    <span className="ml-2 text-sm">
                      ({((candidate.votes / votingResults.totalVotes) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
                <button
                  onClick={() => handleVote(candidate.id)}
                  disabled={
                    remainingTime === 0 ||
                    voterInfo?.hasVoted ||
                    voterInfo?.isBlacklisted ||
                    emergencyStop
                  }
                  className={`w-full px-4 py-2 rounded-lg text-white font-medium
                    ${(remainingTime === 0 || voterInfo?.hasVoted || voterInfo?.isBlacklisted || emergencyStop)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                >
                  {voterInfo?.hasVoted
                    ? 'Already Voted'
                    : voterInfo?.isBlacklisted
                      ? 'Blacklisted'
                      : emergencyStop
                        ? 'Voting Stopped'
                        : 'Vote'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageVoting;