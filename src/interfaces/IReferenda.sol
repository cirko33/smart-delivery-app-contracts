// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IReferenda {
    event ProposalCreated (
        uint256 indexed id
    );

    event VoteSubmitted (
        uint256 indexed id,
        address voter,
        bool isFor
    );

    event ProposalResolved (
        uint256 indexed id,
        bool accepted
    );

    enum Resolution {
        PROPOSED,
        ACCEPTED,
        REJECTED
    }

    struct Backing {
        uint256 yay;
        uint256 nay;
    }
    
    struct Referenda {
        mapping(address => bool) votes;
        Resolution resolution;
        Backing backing;
        uint256 validUntil;
    }

    function propose(string calldata _title, string calldata _description) external returns (uint256);
    function vote(uint256 referendaId, bool isFor) external;
    function resolve(uint256 referendaId) external;
}