const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Enhanced Voting Contract", function () {
  let EnhancedVoting;
  let voting;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    EnhancedVoting = await ethers.getContractFactory("Voting");
    // Deploy with minimum voting power of 1 and only admin can add candidates
    voting = await EnhancedVoting.deploy(1, false);
  });

  // Keep existing deployment tests and add new ones
  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await voting.admin()).to.equal(owner.address);
    });

    it("Should start with voting not started", async function () {
      expect(await voting.votingStarted()).to.equal(false);
    });

    it("Should set correct initial parameters", async function () {
      expect(await voting.minimumVotingPower()).to.equal(1);
      expect(await voting.canVotersAddCandidates()).to.equal(false);
      expect(await voting.emergencyStop()).to.equal(false);
    });
  });

  describe("Enhanced Candidate Management", function () {
    it("Should allow admin to add candidates with description", async function () {
      await expect(voting.addCandidate("Candidate 1", "Description 1"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(0, "Candidate 1", owner.address);

      const [id, name, description, votes] = await voting.getCandidate(0);
      expect(id).to.equal(0);
      expect(name).to.equal("Candidate 1");
      expect(description).to.equal("Description 1");
      expect(votes).to.equal(0);
    });

    it("Should allow voters to add candidates when enabled", async function () {
      // Deploy new contract with voter candidate addition enabled
      voting = await EnhancedVoting.deploy(1, true);
      
      await expect(voting.connect(addr1).addCandidate("Voter Candidate", "Voter Description"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(0, "Voter Candidate", addr1.address);
    });
  });

  describe("Voting Power System", function () {
    beforeEach(async function () {
      await voting.addCandidate("Candidate 1", "Description 1");
      await voting.addCandidate("Candidate 2", "Description 2");
      await voting.startVoting(60);
    });

    it("Should assign voting power correctly", async function () {
      await voting.assignVotingPower(addr1.address, 2);
      const voterInfo = await voting.getVoterInfo(addr1.address);
      expect(voterInfo.votingPower).to.equal(2);
    });

    it("Should not allow voting without minimum voting power", async function () {
      // addr1 has no voting power assigned yet
      await expect(
        voting.connect(addr1).vote(0)
      ).to.be.revertedWithCustomError(voting, "InsufficientVotingPower");
    });

    it("Should count votes according to voting power", async function () {
      await voting.assignVotingPower(addr1.address, 3);
      await voting.connect(addr1).vote(0);

      const [, , , votes] = await voting.getCandidate(0);
      expect(votes).to.equal(3);
    });
  });

  describe("Emergency Controls", function () {
    beforeEach(async function () {
      await voting.addCandidate("Candidate 1", "Description 1");
      await voting.addCandidate("Candidate 2", "Description 2"); // Added second candidate
      await voting.startVoting(60);
      await voting.assignVotingPower(addr1.address, 1);
    });

    it("Should prevent voting during emergency stop", async function () {
      await voting.toggleEmergencyStop();
      await expect(
        voting.connect(addr1).vote(0)
      ).to.be.revertedWithCustomError(voting, "EmergencyStopActive");
    });

    it("Should prevent blacklisted voters from voting", async function () {
      await voting.setVoterBlacklist(addr1.address, true);
      await expect(
        voting.connect(addr1).vote(0)
      ).to.be.revertedWithCustomError(
        voting, 
        "VoterIsBlacklisted"
      ).withArgs(addr1.address);
    });

    it("Should emit events for emergency actions", async function () {
      await expect(voting.toggleEmergencyStop())
        .to.emit(voting, "EmergencyStopToggled")
        .withArgs(true);

      await expect(voting.setVoterBlacklist(addr1.address, true))
        .to.emit(voting, "VoterBlacklistUpdated")
        .withArgs(addr1.address, true);
    });
  });

  describe("Vote Management", function () {
    beforeEach(async function () {
      await voting.addCandidate("Candidate 1", "Description 1");
      await voting.addCandidate("Candidate 2", "Description 2");
      await voting.startVoting(60);
      await voting.assignVotingPower(addr1.address, 2);
    });

    it("Should allow vote revocation", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr1).revokeVote();

      const [, , , votes] = await voting.getCandidate(0);
      expect(votes).to.equal(0);

      const voterInfo = await voting.getVoterInfo(addr1.address);
      expect(voterInfo.hasVoted).to.equal(false);
    });

    it("Should not allow vote revocation if not voted", async function () {
      await expect(
        voting.connect(addr1).revokeVote()
      ).to.be.revertedWithCustomError(
        voting, 
        "NoVoteToRevoke"
      ).withArgs(addr1.address);
    });
  });

  describe("Enhanced Information Retrieval", function () {
    beforeEach(async function () {
      await voting.addCandidate("Candidate 1", "Description 1");
      await voting.addCandidate("Candidate 2", "Description 2");
      await voting.startVoting(60);
      await voting.assignVotingPower(addr1.address, 2);
      await voting.assignVotingPower(addr2.address, 3);
    });

    it("Should provide accurate voting results", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr2).vote(1);

      const [totalVotes, voteCounts] = await voting.getVotingResults();
      expect(totalVotes).to.equal(5); // 2 + 3
      expect(voteCounts[0]).to.equal(2);
      expect(voteCounts[1]).to.equal(3);
    });

    it("Should provide complete voter information", async function () {
      await voting.connect(addr1).vote(0);
      await voting.setVoterBlacklist(addr1.address, true);

      const voterInfo = await voting.getVoterInfo(addr1.address);
      expect(voterInfo.hasVoted).to.equal(true);
      expect(voterInfo.votedCandidateId).to.equal(0);
      expect(voterInfo.votingPower).to.equal(2);
      expect(voterInfo.isBlacklisted).to.equal(true);
    });
  });

  describe("Enhanced Integration Tests", function () {
    it("Should handle complete voting cycle with new features", async function () {
      // Setup
      await voting.addCandidate("Candidate 1", "Description 1");
      await voting.addCandidate("Candidate 2", "Description 2");
      
      // Assign different voting powers
      await voting.assignVotingPower(addr1.address, 2);
      await voting.assignVotingPower(addr2.address, 3);
      await voting.assignVotingPower(addr3.address, 1);
      
      // Start voting
      await voting.startVoting(60);
      
      // Multiple users vote
      await voting.connect(addr1).vote(0);
      await voting.connect(addr2).vote(1);
      
      // Revoke one vote
      await voting.connect(addr1).revokeVote();
      
      // Blacklist a user
      await voting.setVoterBlacklist(addr3.address, true);
      
      // Check final results
      const [totalVotes, voteCounts] = await voting.getVotingResults();
      expect(totalVotes).to.equal(3); // Only addr2's votes (3) should count
      expect(voteCounts[0]).to.equal(0); // addr1's vote was revoked
      expect(voteCounts[1]).to.equal(3); // addr2's vote remains
    });

    it("Should handle emergency situations", async function () {
      // Setup
      await voting.addCandidate("Candidate 1", "Description 1");
      await voting.addCandidate("Candidate 2", "Description 2");
      await voting.assignVotingPower(addr1.address, 2);
      await voting.startVoting(60);
      
      // Vote before emergency
      await voting.connect(addr1).vote(0);
      
      // Trigger emergency
      await voting.toggleEmergencyStop();
      
      // Verify voting is blocked
      await voting.assignVotingPower(addr2.address, 2);
      await expect(
        voting.connect(addr2).vote(1)
      ).to.be.revertedWithCustomError(voting, "EmergencyStopActive");
      
      // Resume voting
      await voting.toggleEmergencyStop();
      
      // Verify voting works again
      await voting.connect(addr2).vote(1);
      
      // Check final state
      const [totalVotes, voteCounts] = await voting.getVotingResults();
      expect(totalVotes).to.equal(4); // 2 + 2
      expect(voteCounts[0]).to.equal(2);
      expect(voteCounts[1]).to.equal(2);
    });
  });
});
