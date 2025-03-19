const { ethers } = require("ethers");
require("dotenv").config();

// ✅ Use the correct new contract address
const CONTRACT_ADDRESS = "0x58D74f71e1B74557d973A9ad7C91FBefF79d81E7";

// ✅ Choose action: "create", "contribute", "withdraw", "fetch"
const ACTION = "fetch";  // Change this as needed

async function main() {
    // ✅ Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // ✅ Load contract ABI
    const CONTRACT_ABI = require("../artifacts/contracts/Crowdfunding.sol/Crowdfunding.json").abi;

    // ✅ Load the deployed contract
    const crowdfunding = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log("✅ Connected to contract at:", CONTRACT_ADDRESS);

    // ✅ Set Campaign ID (for contribute/withdraw)
    const campaignId = 1;

    if (ACTION === "create") {
        // 📌 **Create a Campaign**
        console.log("🚀 Creating a new campaign...");
        const tx = await crowdfunding.createCampaign(
            "AI Innovation Fund",  // Title
            "Funding AI research projects",  // Description
            ethers.parseEther("1"),  // Goal: 1 ETH
            86400 * 3  // Duration: 3 days
        );
        await tx.wait();
        console.log("✅ Campaign created successfully!");

    } else if (ACTION === "contribute") {
        // 📌 **Contribute to a Campaign**
        console.log(`💰 Contributing 0.1 ETH to Campaign ${campaignId}...`);
        const tx = await crowdfunding.contribute(campaignId, {
            value: ethers.parseEther("0.1"),  // Contribution: 0.1 ETH
        });
        await tx.wait();
        console.log("✅ Contribution successful!");

    } else if (ACTION === "withdraw") {
        // 📌 **Withdraw Funds**
        console.log(`💸 Attempting to withdraw funds for Campaign ${campaignId}...`);
        const campaign = await crowdfunding.getCampaignDetails(campaignId);

        const latestBlock = await provider.getBlock("latest");
        if (BigInt(latestBlock.timestamp) < BigInt(campaign.deadline)) {
            console.log("⏳ Campaign is still active, cannot withdraw yet.");
            return;
        }

        if (campaign.claimed) {
            console.log("❌ Funds already withdrawn.");
            return;
        }

        if (BigInt(campaign.fundsRaised) < BigInt(campaign.goal)) {
            console.log("⚠️ Goal not met, cannot withdraw.");
            return;
        }

        const tx = await crowdfunding.withdrawFunds(campaignId);
        await tx.wait();
        console.log("✅ Funds withdrawn successfully!");

    } else if (ACTION === "fetch") {
        // 📌 **Fetch Campaign Details**
        console.log(`📢 Fetching details for Campaign ${campaignId}...`);
        const campaign = await crowdfunding.getCampaignDetails(campaignId);

        console.log(`
            🔹 Title: ${campaign.title}
            🔹 Description: ${campaign.description}
            🔹 Goal: ${ethers.formatEther(BigInt(campaign.goal))} ETH
            🔹 Funds Raised: ${ethers.formatEther(BigInt(campaign.fundsRaised))} ETH
            🔹 Deadline: ${new Date(Number(campaign.deadline) * 1000)}
            🔹 Claimed: ${campaign.claimed}
        `);
    } else {
        console.log("⚠️ Invalid ACTION. Use 'create', 'contribute', 'withdraw', or 'fetch'.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
