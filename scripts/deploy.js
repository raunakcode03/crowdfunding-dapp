const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");

    // Deploy the contract
    const crowdfunding = await Crowdfunding.deploy();
    await crowdfunding.waitForDeployment(); // ✅ Updated deployment method

    // Get contract address
    const contractAddress = await crowdfunding.getAddress();
    console.log(`✅ Crowdfunding contract deployed at: ${contractAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
