// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "../interfaces/IReferenda.sol";

contract DAO is IReferenda {
    struct Proposal {
        string title;
        string description;
    }

    modifier _noActiveProposal() {
        require(!hasActiveProposal[msg.sender], "User has active proposal");
        _;
    }

    // modifier _isVoter() {
    //     require(points[msg.sender] > minAmountToPropose, "User must have minimum number of points to propose");
    //     _;
    // }

    // To eliminate possibility of spamming
    mapping(address => bool) public hasActiveProposal;
    mapping(uint256 => Proposal) public proposals;
    // mapping(address => uint256) public points;
    mapping(uint256 => Referenda) public referendas;
    uint256 allPointsCount;

    uint256 private counter;
    uint256 public immutable defaultValidUntil;

    constructor(uint256 _defaultValidUntil) {
        counter = 0;
        defaultValidUntil = _defaultValidUntil;
    }

    function propose(
        string calldata _title,
        string calldata _description
    ) external _noActiveProposal /*_isVoter */ returns (uint256) {
        hasActiveProposal[msg.sender] = true;
        uint256 id = counter;
        counter++;
        proposals[id] = Proposal(_title, _description);
        referendas[id].validUntil = block.number + defaultValidUntil;

        return id;
    }

    function vote(uint256 referendaId, bool isFor /* _isVoter */) external {
        require(counter > referendaId, "Referenda id is invalid");
        Referenda storage referenda = referendas[referendaId];
        require(
            referenda.validUntil > block.number,
            "Window for voting expired"
        );
        require(!referenda.votes[msg.sender], "Already voted");
        referenda.votes[msg.sender] = true;
        if (isFor) {
            referenda.backing.yay++;
        } else {
            referenda.backing.nay++;
        }
    }

    function resolve(uint256 referendaId) external {
        require(counter > referendaId, "Referenda id is invalid");
        Referenda storage referenda = referendas[referendaId];
        require(block.number >= referenda.validUntil, "Voting is not finished");

        if (referenda.backing.yay > referenda.backing.nay) {
            referenda.resolution = Resolution.ACCEPTED;
        } else {
            referenda.resolution = Resolution.REJECTED;
        }
    }
}
