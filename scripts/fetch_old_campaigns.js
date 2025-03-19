const { ethers } = require("ethers");
require("dotenv").config();

const OLD_CONTRACT_ADDRESS = "0x68cC8A82402dC65475CC1F911202bA42c8014872"; // Replace with the actual old contract address
const NEW_CONTRACT_ADDRESS = "0x58D74f71e1B74557d973A9ad7C91FBefF79d81E7"; // Replace with the new contract address
const CONTRACT_ABI = require("../artifacts/contracts/Crowdfunding.sol/Crowdfunding.json").abi;

// Connect to Sepolia network
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Old contract instance
const oldContract = new ethers.Contract(OLD_CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// New contract instance
const newContract = new ethers.Contract(NEW_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

async function migrateCampaigns() {
    const campaignCount = await oldContract.campaignCount();

    console.log(`📢 Total campaigns found: ${campaignCount}`);

    for (let i = 1; i <= campaignCount; i++) {
        const campaign = await oldContract.campaigns(i);

        console.log(`🚀 Migrating Campaign ${i}: ${campaign.title}`);

        // ✅ Fix BigInt issue with explicit conversion
        const adjustedDeadline = Number(campaign.deadline) - Math.floor(Date.now() / 1000);

        const tx = await newContract.createCampaign(
            campaign.title,
            campaign.description,
            campaign.goal.toString(), // ✅ Convert BigInt to string
            adjustedDeadline > 0 ? adjustedDeadline : 86400 // Ensure at least 1 day duration
        );

        await tx.wait();
        console.log(`✅ Campaign ${i} migrated successfully!`);
    }
}

migrateCampaigns().catch(console.error);