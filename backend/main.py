from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from web3 import Web3
import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

app = FastAPI()

# ✅ Enable CORS (Allows Frontend Communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to frontend URL for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Connect to Ethereum Network (Sepolia)
w3 = Web3(Web3.HTTPProvider(os.getenv("SEPOLIA_RPC_URL")))
if not w3.is_connected():
    raise Exception("❌ Failed to connect to Ethereum network!")

# ✅ Load Smart Contract
CONTRACT_ADDRESS = "0x58D74f71e1B74557d973A9ad7C91FBefF79d81E7"
CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
        "name": "getCampaignDetails",
        "outputs": [
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "string", "name": "title", "type": "string"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "uint256", "name": "goal", "type": "uint256"},
            {"internalType": "uint256", "name": "fundsRaised", "type": "uint256"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"},
            {"internalType": "bool", "name": "claimed", "type": "bool"},
            {"internalType": "bool", "name": "cancelled", "type": "bool"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "campaignCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

@app.get("/")
def home():
    return {"message": "✅ Crowdfunding Backend API is running!"}

# ✅ **Fetch All Campaigns**
@app.get("/campaigns")
def get_campaigns():
    try:
        total_campaigns = contract.functions.campaignCount().call()
        print(f"📢 Total Campaigns Found: {total_campaigns}")

        if total_campaigns == 0:
            return {"campaigns": []}

        campaign_list = []
        for i in range(1, total_campaigns + 1):  
            campaign = contract.functions.getCampaignDetails(i).call()
            campaign_list.append({
                "id": i,
                "owner": campaign[0],
                "title": campaign[1],
                "description": campaign[2],
                "goal": float(w3.from_wei(campaign[3], 'ether')),
                "fundsRaised": float(w3.from_wei(campaign[4], 'ether')),
                "deadline": int(campaign[5]),
                "claimed": campaign[6],
                "cancelled": campaign[7],
            })

        return {"campaigns": campaign_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"❌ Error fetching campaigns: {str(e)}")
