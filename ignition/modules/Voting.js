const hre = require("hardhat");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const Voting = await hre.ethers.getContractFactory("Voting");
    const minimumVotingPower = 1;
    const canVotersAddCandidates = false;

    const voting = await Voting.deploy(minimumVotingPower, canVotersAddCandidates);
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
        constructorArguments: [minimumVotingPower, canVotersAddCandidates],
      });
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
