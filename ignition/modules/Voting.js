const hre = require("hardhat");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const Voting = await hre.ethers.getContractFactory("Voting");
    const minimumVotingPower = 1;

    const voting = await Voting.deploy(minimumVotingPower,);
    await voting.waitForDeployment();

    const address = await voting.getAddress();
    console.log("Voting contract deployed to:", address);

    // Verify contract on Etherscan for non-local networks
    const network = hre.network.name; // Update to get network name
    if (network !== "hardhat" && network !== "localhost") {
      console.log("Waiting for block confirmations...");
      await voting.deployTransaction.wait(6);

      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [minimumVotingPower],
      });
    }
        // Optional: Add some initial candidates for testing
    // Only do this for local testing networks
    if (network === "hardhat" || network === "localhost") {
      await voting.addCandidate("Candidate 1", "Description of Candidate 1");
      await voting.addCandidate("Candidate 2", "Description of Candidate 2");
      await voting.addCandidate("Candidate 3", "Description of Candidate 3");
      console.log("Added initial test candidates");
    }

  

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
