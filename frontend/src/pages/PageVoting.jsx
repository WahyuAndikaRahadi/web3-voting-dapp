import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { contractABI, contractAddress } from '../constant';

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

  // Initialize contract and load initial data
  const initContract = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask');
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const currentAccount = accounts[0];
      
      const signer = await provider.getSigner();
      const votingContract = new Contract(
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

      return votingContract;
    } catch (err) {
      console.error('Init contract error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Load candidates and voting results
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
      setVotingResults({ 
        totalVotes: Number(totalVotes), 
        voteCounts: voteCounts.map(count => Number(count)) 
      });
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Error loading candidates');
    }
  };

  // Load voter information for a specific address
  const loadVoterInfo = async (votingContract, voterAddr) => {
    try {
      if (!votingContract || !voterAddr) {
        console.warn('Missing contract or voter address');
        return;
      }

      const [hasVoted, votedCandidateId, votingPower, isBlacklisted] = 
        await votingContract.getVoterInfo(voterAddr);
      
      setVoterInfo({
        hasVoted,
        votedCandidateId: Number(votedCandidateId),
        votingPower: Number(votingPower),
        isBlacklisted
      });
    } catch (err) {
      console.error('Error loading voter info:', err);
      setError('Failed to load voter information');
    }
  };

  // Update remaining time
  const updateRemainingTime = async (votingContract) => {
    try {
      if (!votingContract) return;

      const time = await votingContract.getRemainingTime();
      setRemainingTime(Number(time));

      if (Number(time) > 0) {
        setTimeout(() => updateRemainingTime(votingContract), 1000);
      }
    } catch (err) {
      console.error('Error updating time:', err);
      setError('Error updating remaining time');
    }
  };

  // Reload all data
  const reloadAllData = async (votingContract, currentAccount) => {
    if (!votingContract || !currentAccount) return;

    try {
      const admin = await votingContract.admin();
      setIsAdmin(currentAccount.toLowerCase() === admin.toLowerCase());
      
      await Promise.all([
        loadCandidates(votingContract),
        loadVoterInfo(votingContract, currentAccount),
        updateRemainingTime(votingContract)
      ]);

      const stopStatus = await votingContract.emergencyStop();
      setEmergencyStop(stopStatus);
    } catch (err) {
      console.error('Error reloading data:', err);
      setError('Error refreshing data');
    }
  };

  // Initial setup
  useEffect(() => {
    const init = async () => {
      try {
        const votingContract = await initContract();
        await reloadAllData(votingContract, account);

        // Set up event listeners
        votingContract.on('VoteCasted', async () => {
          await reloadAllData(votingContract, account);
        });

        votingContract.on('CandidateAdded', async () => {
          await loadCandidates(votingContract);
        });

        votingContract.on('VotingStarted', async () => {
          await updateRemainingTime(votingContract);
        });

        votingContract.on('VotingPowerAssigned', async (voter) => {
          if (voter.toLowerCase() === account.toLowerCase()) {
            await loadVoterInfo(votingContract, account);
          }
        });

        votingContract.on('EmergencyStopToggled', (stopped) => {
          setEmergencyStop(stopped);
        });

        votingContract.on('VoterBlacklistUpdated', async (voter) => {
          if (voter.toLowerCase() === account.toLowerCase()) {
            await loadVoterInfo(votingContract, account);
          }
        });

        votingContract.on('VoteRevoked', async () => {
          await reloadAllData(votingContract, account);
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

  // Handle account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0 && accounts[0] !== account) {
        const newAccount = accounts[0];
        setAccount(newAccount);
        
        if (contract) {
          // Reload all data for the new account
          await reloadAllData(contract, newAccount);
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

  // Transaction helper functions
  const checkNetwork = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 31337n) {
        throw new Error('Please connect to the correct network (Localhost 31337)');
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

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

  const estimateGas = async (transaction) => {
    try {
      return await transaction.estimateGas();
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
    }

    setError(errorMessage);
    console.error('Transaction error:', error);
  };

  const executeTransaction = async (transactionFunc, preChecks = true) => {
    try {
      if (preChecks) {
        const networkOk = await checkNetwork();
        if (!networkOk) return;

        const balanceOk = await checkBalance(account);
        if (!balanceOk) return;
      }

      const transaction = await transactionFunc();
      await estimateGas(transaction);

      setError('Transaction pending...');
      const receipt = await transaction.wait();
      setError('');

      // Reload data after successful transaction
      await reloadAllData(contract, account);

      return receipt;
    } catch (error) {
      handleTransactionError(error);
      throw error;
    }
  };

  // Action handlers
  const handleAddCandidate = async () => {
    try {
      if (!contract || !isAdmin) {
        setError('Not authorized');
        return;
      }

      if (!newCandidate.name.trim() || !newCandidate.description.trim()) {
        setError('Candidate name and description are required');
        return;
      }

      await executeTransaction(
        () => contract.addCandidate(newCandidate.name, newCandidate.description)
      );

      setNewCandidate({ name: '', description: '' });
    } catch (err) {
      console.error('Add candidate error:', err);
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

      await executeTransaction(
        () => contract.startVoting(votingDuration)
      );
    } catch (err) {
      console.error('Start voting error:', err);
    }
  };

  const handleVote = async (candidateId) => {
    try {
      if (!contract || !account) {
        setError('Please connect your wallet');
        return;
      }

      await executeTransaction(
        () => contract.vote(candidateId)
      );
    } catch (err) {
      console.error('Voting error:', err);
    }
  };

  const handleRevokeVote = async () => {
    try {
      if (!contract) return;

      await executeTransaction(
        () => contract.revokeVote()
      );
    } catch (err) {
      console.error('Revoke vote error:', err);
    }
  };

  const handleAssignVotingPower = async () => {
    try {
      if (!contract || !isAdmin) {
        setError('Not authorized');
        return;
      }

      if (!voterAddress || !votingPowerInput) {
        setError('Voter address and voting power are required');
        return;
      }

      await executeTransaction(
        () => contract.assignVotingPower(voterAddress, votingPowerInput)
      );

      setVoterAddress('');
      setVotingPowerInput('');
    } catch (err) {
      console.error('Assign voting power error:', err);
    }
  };

  const handleToggleEmergencyStop = async () => {
    try {
      if (!contract || !isAdmin) {
        setError('Not authorized');
        return;
      }

      await executeTransaction(
        () => contract.toggleEmergencyStop()
      );
    } catch (err) {
      console.error('Emergency stop error:', err);
    }
  };

  const handleSetBlacklist = async (blacklisted) => {
    try {
      if (!contract || !isAdmin) {
        setError('Not authorized');
        return;
      }

      if (!blacklistAddress) {
        setError('Voter address is required');
        return;
      }

      await executeTransaction(
        () => contract.setVoterBlacklist(blacklistAddress, blacklisted)
      );

      setBlacklistAddress('');
    } catch (err) {
      console.error('Blacklist update error:', err);
    }
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
          {["L", "o", "a", "d", "i", "n", "g", ".", ".", "."].map((char, index) => (
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
<div className="min-h-screen bg-gray-900 text-white">
  <div className="max-w-6xl mx-auto p-6">
    {error && (
      <div
        className={`mb-4 p-4 rounded-lg ${
          error.includes('pending')
            ? 'bg-blue-100 border border-blue-300'
            : error.includes('rejected')
            ? 'bg-yellow-100 border border-yellow-300'
            : 'bg-red-100 border border-red-300'
        }`}
      >
        <div className="flex items-center">
          {error.includes('pending') && (
            <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span
            className={`${
              error.includes('pending')
                ? 'text-blue-700'
                : error.includes('rejected')
                ? 'text-yellow-700'
                : 'text-red-700'
            }`}
          >
            {error}
          </span>
        </div>
      </div>
    )}

    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white">Blockchain Voting dApp</h2>
        {emergencyStop && (
          <div className="mt-2 p-2 bg-red-200 text-red-800 rounded">
            Emergency Stop Active
          </div>
        )}
      </div>

      {/* Account & Voter Info */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="font-medium text-gray-300">
              Connected Account: <span className="text-white">{account}</span>
            </p>
            <p className="font-medium text-gray-300">
              Time Remaining: <span className="text-white">{Math.floor(remainingTime / 60)}m {remainingTime % 60}s</span>
            </p>
          </div>
          {voterInfo && (
            <div className="space-y-2">
              <p className="font-medium text-gray-300">
                Voting Power: <span className="text-white">{voterInfo.votingPower}</span>
              </p>
              <p className="font-medium text-gray-300">
                Status: {voterInfo.isBlacklisted ? (
                  <span className="text-red-600">Blacklisted</span>
                ) : voterInfo.hasVoted ? (
                  <span className="text-green-500">Voted</span>
                ) : (
                  <span className="text-blue-500">Not Voted</span>
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
          <div className="space-y-4 mb-6 p-4 border border-gray-600 rounded-lg bg-gray-800">
            <h3 className="font-semibold text-gray-300">Admin Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                placeholder="Candidate Name"
                className="px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded-lg"
              />
              <input
                type="text"
                value={newCandidate.description}
                onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                placeholder="Candidate Description"
                className="px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded-lg"
              />
              <button
                onClick={handleAddCandidate}
                className="md:col-span-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Candidate
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={votingDuration}
                onChange={(e) => setVotingDuration(parseInt(e.target.value))}
                placeholder="Duration (minutes)"
                min="1"
                className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded-lg"
              />
              <button
                onClick={handleStartVoting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Voting
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={voterAddress}
                onChange={(e) => setVoterAddress(e.target.value)}
                placeholder="Voter Address"
                className="px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded-lg"
              />
              <input
                type="number"
                value={votingPowerInput}
                onChange={(e) => setVotingPowerInput(e.target.value)}
                placeholder="Voting Power"
                min="1"
                className="px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded-lg"
              />
              <button
                onClick={handleAssignVotingPower}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Assign Power
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={blacklistAddress}
                onChange={(e) => setBlacklistAddress(e.target.value)}
                placeholder="Voter Address"
                className="px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded-lg"
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

            <button
              onClick={handleToggleEmergencyStop}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium ${
                emergencyStop ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {emergencyStop ? 'Resume Voting' : 'Emergency Stop'}
            </button>
          </div>
        )}

        {/* Voting Results */}
        {votingResults && (
          <div className="mb-6 p-4 border border-gray-700 rounded-lg bg-gray-800">
            <h3 className="font-semibold text-gray-300 mb-2">Voting Results</h3>
            <p className="text-gray-400">
              Total Votes Cast: <span className="font-medium text-white">{votingResults.totalVotes}</span>
            </p>
          </div>
        )}

        {/* Candidate List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="border border-gray-600 rounded-lg p-4 bg-gray-800 shadow-sm">
              <h3 className="font-medium text-lg text-white mb-2">{candidate.name}</h3>
              <p className="text-gray-400 mb-4">{candidate.description}</p>
              <button
                onClick={() => handleVote(candidate.id)}
                disabled={voterInfo?.hasVoted || !votingStatus}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Vote
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default PageVoting;