// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfunding {
    struct Campaign {
        address payable owner;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 fundsRaised;
        bool claimed;
        bool cancelled;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string title, uint256 goal, uint256 deadline);
    event Funded(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event Withdrawn(uint256 indexed campaignId, uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId);
    event RefundIssued(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Campaign does not exist");
        _;
    }

    modifier onlyOwner(uint256 _campaignId) {
        require(msg.sender == campaigns[_campaignId].owner, "Not campaign owner");
        _;
    }

    modifier beforeDeadline(uint256 _campaignId) {
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign has ended");
        _;
    }

    modifier afterDeadline(uint256 _campaignId) {
        require(block.timestamp > campaigns[_campaignId].deadline, "Campaign is still active");
        _;
    }

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) public {
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        campaignCount++;
        campaigns[campaignCount] = Campaign(
            payable(msg.sender),
            _title,
            _description,
            _goal,
            block.timestamp + _duration,
            0,
            false,
            false
        );

        emit CampaignCreated(campaignCount, msg.sender, _title, _goal, block.timestamp + _duration);
    }

    function contribute(uint256 _campaignId) public payable campaignExists(_campaignId) beforeDeadline(_campaignId) {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(!campaigns[_campaignId].cancelled, "Campaign is cancelled");

        Campaign storage campaign = campaigns[_campaignId];
        campaign.fundsRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;

        emit Funded(_campaignId, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 _campaignId) public campaignExists(_campaignId) onlyOwner(_campaignId) afterDeadline(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];

        require(campaign.fundsRaised >= campaign.goal, "Goal not met");
        require(!campaign.claimed, "Funds already withdrawn");
        require(block.timestamp >= campaign.deadline + 2 days, "Funds can be withdrawn only after 2 days");

        campaign.claimed = true;
        campaign.owner.transfer(campaign.fundsRaised);

        emit Withdrawn(_campaignId, campaign.fundsRaised);
    }

    function cancelCampaign(uint256 _campaignId) public campaignExists(_campaignId) onlyOwner(_campaignId) beforeDeadline(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        campaign.cancelled = true;

        emit CampaignCancelled(_campaignId);
    }

    function refund(uint256 _campaignId) public campaignExists(_campaignId) afterDeadline(_campaignId) {
        require(contributions[_campaignId][msg.sender] > 0, "No contributions found");
        require(!campaigns[_campaignId].claimed, "Funds already withdrawn by owner");
        require(campaigns[_campaignId].fundsRaised < campaigns[_campaignId].goal, "Campaign was successful");

        uint256 amount = contributions[_campaignId][msg.sender];
        contributions[_campaignId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit RefundIssued(_campaignId, msg.sender, amount);
    }

    function getCampaignDetails(uint256 _campaignId) public view campaignExists(_campaignId) returns (
        address owner,
        string memory title,
        string memory description,
        uint256 goal,
        uint256 fundsRaised,
        uint256 deadline,
        bool claimed,
        bool cancelled
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (campaign.owner, campaign.title, campaign.description, campaign.goal, campaign.fundsRaised, campaign.deadline, campaign.claimed, campaign.cancelled);
    }
}
