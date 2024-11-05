// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
    }
    
    struct Voter {
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 votingPower;
    }
    
    address public admin;
    mapping(address => Voter) public voters;
    mapping(address => bool) public blacklistedVoters;
    Candidate[] public candidates;
    uint256 public votingEnd;
    bool public votingStarted;
    uint256 public minimumVotingPower;
    bool public canVotersAddCandidates;
    uint256 public totalVotes;
    bool public emergencyStop;
    
    // Events
    event VoteCasted(address indexed voter, uint256 indexed candidateId, uint256 votingPower);
    event CandidateAdded(uint256 indexed candidateId, string name, address indexed addedBy);
    event VotingStarted(uint256 endTime);
    event VotingPowerAssigned(address indexed voter, uint256 power);
    event EmergencyStopToggled(bool stopped);
    event VoterBlacklistUpdated(address indexed voter, bool blacklisted);
    event VoteRevoked(address indexed voter, uint256 indexed candidateId);
    
    // Custom Errors
    error OnlyAdmin(address caller);
    error VotingNotStarted();
    error VotingEnded();
    error AlreadyVoted(address voter);
    error InvalidCandidateId(uint256 candidateId);
    error VotingAlreadyStarted();
    error CandidateAdditionClosed();
    error InsufficientVotingPower(address voter, uint256 power, uint256 required);
    error EmergencyStopActive();
    error VoterIsBlacklisted(address voter);
    error NoVoteToRevoke(address voter);
    error NotEnoughTimeElapsed();
    error InvalidVotingDuration();
    error NotEnoughCandidates();
    
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin(msg.sender);
        _;
    }
    
    modifier votingOngoing() {
        if (!votingStarted) revert VotingNotStarted();
        if (block.timestamp >= votingEnd) revert VotingEnded();
        if (emergencyStop) revert EmergencyStopActive();
        _;
    }
    
    modifier notBlacklisted() {
        if (blacklistedVoters[msg.sender]) revert VoterIsBlacklisted(msg.sender);
        _;
    }
    
    constructor(uint256 _minimumVotingPower, bool _canVotersAddCandidates) {
        if (_minimumVotingPower == 0) revert InvalidVotingDuration();
        admin = msg.sender;
        votingStarted = false;
        minimumVotingPower = _minimumVotingPower;
        canVotersAddCandidates = _canVotersAddCandidates;
        emergencyStop = false;
    }
    
    function addCandidate(string memory _name, string memory _description) public {
        if (votingStarted) revert CandidateAdditionClosed();
        if (!canVotersAddCandidates && msg.sender != admin) revert OnlyAdmin(msg.sender);
        
        uint256 candidateId = candidates.length;
        candidates.push(Candidate(candidateId, _name, _description, 0));
        emit CandidateAdded(candidateId, _name, msg.sender);
    }
    
    function startVoting(uint256 _durationInMinutes) public onlyAdmin {
        if (votingStarted) revert VotingAlreadyStarted();
        if (candidates.length < 2) revert NotEnoughCandidates();
        if (_durationInMinutes == 0) revert InvalidVotingDuration();
        
        votingStarted = true;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
        emit VotingStarted(votingEnd);
    }
    
    function vote(uint256 _candidateId) public votingOngoing notBlacklisted {
        // Check if voting has started
        if (!votingStarted) revert VotingNotStarted();
        
        // Check if voting has ended
        if (block.timestamp >= votingEnd) revert VotingEnded();
        
        // Check if voter has already voted
        if (voters[msg.sender].hasVoted) revert AlreadyVoted(msg.sender);
        
        // Check if candidate ID is valid
        if (_candidateId >= candidates.length) revert InvalidCandidateId(_candidateId);
        
        // Check voting power
        if (voters[msg.sender].votingPower < minimumVotingPower) {
            revert InsufficientVotingPower(
                msg.sender, 
                voters[msg.sender].votingPower, 
                minimumVotingPower
            );
        }
        
        // Perform the vote
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount += voters[msg.sender].votingPower;
        totalVotes += voters[msg.sender].votingPower;
        
        emit VoteCasted(msg.sender, _candidateId, voters[msg.sender].votingPower);
    }

    
    function assignVotingPower(address _voter, uint256 _power) public onlyAdmin {
        if (_power < minimumVotingPower) {
            revert InsufficientVotingPower(_voter, _power, minimumVotingPower);
        }
        voters[_voter].votingPower = _power;
        emit VotingPowerAssigned(_voter, _power);
    }
    
    function toggleEmergencyStop() public onlyAdmin {
        emergencyStop = !emergencyStop;
        emit EmergencyStopToggled(emergencyStop);
    }
    
    function setVoterBlacklist(address _voter, bool _blacklisted) public onlyAdmin {
        blacklistedVoters[_voter] = _blacklisted;
        emit VoterBlacklistUpdated(_voter, _blacklisted);
    }
    
    function revokeVote() public votingOngoing {
        Voter storage voter = voters[msg.sender];
        if (!voter.hasVoted) revert NoVoteToRevoke(msg.sender);
        
        uint256 candidateId = voter.votedCandidateId;
        candidates[candidateId].voteCount -= voter.votingPower;
        totalVotes -= voter.votingPower;
        
        voter.hasVoted = false;
        voter.votedCandidateId = 0;
        
        emit VoteRevoked(msg.sender, candidateId);
    }
    
    // View functions
    function getCandidatesCount() public view returns (uint256) {
        return candidates.length;
    }
    
    function getCandidate(uint256 _candidateId) public view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 voteCount
    ) {
        if (_candidateId >= candidates.length) revert InvalidCandidateId(_candidateId);
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.description, candidate.voteCount);
    }
    
    function getRemainingTime() public view returns (uint256) {
        if (!votingStarted) return 0;
        if (block.timestamp >= votingEnd) return 0;
        return votingEnd - block.timestamp;
    }
    
    function getVoterInfo(address _voter) public view returns (
        bool hasVoted,
        uint256 votedCandidateId,
        uint256 votingPower,
        bool isBlacklisted
    ) {
        Voter memory voter = voters[_voter];
        return (
            voter.hasVoted,
            voter.votedCandidateId,
            voter.votingPower,
            blacklistedVoters[_voter]
        );
    }
    
    function getVotingResults() public view returns (
        uint256 totalVotesCast,
        uint256[] memory voteCounts
    ) {
        uint256[] memory results = new uint256[](candidates.length);
        for (uint256 i = 0; i < candidates.length; i++) {
            results[i] = candidates[i].voteCount;
        }
        return (totalVotes, results);
    }
}