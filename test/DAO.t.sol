// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

import {Test, console} from "forge-std/Test.sol";
import {DAO} from "../src/contracts/DAO.sol";
import "../src/interfaces/IReferenda.sol";

contract DAOTest is Test {
    DAO public dao;
    address[] private testAddrs;

    uint256 public NUM_OF_ADDR = 4;

    function setUp() public {
        dao = new DAO(50);

        for (uint160 i = 0; i < NUM_OF_ADDR; i++) {
            testAddrs.push(address(i));
        }
    }

    function test_happyPath() public {
        vm.prank(testAddrs[0]);
        uint256 id = dao.propose("test", "test");

        for (uint160 i = 0; i < NUM_OF_ADDR; i++) {
            vm.prank(testAddrs[i]);
            dao.vote(id, true);
        }

        vm.roll(50 + 1);

        vm.prank(testAddrs[0]);
        dao.resolve(id);

        (
            IReferenda.Resolution resolution,
            IReferenda.Backing memory backing,

        ) = dao.referendas(id);

        assert(resolution == IReferenda.Resolution.ACCEPTED);
        assert(backing.yay == NUM_OF_ADDR);
    }

    function test_votingNotFinished() public {
        vm.prank(testAddrs[0]);
        uint256 id = dao.propose("test", "test");

        for (uint160 i = 0; i < NUM_OF_ADDR; i++) {
            vm.prank(testAddrs[i]);
            dao.vote(id, true);
        }

        // vm.roll(50 + 1);

        vm.prank(testAddrs[0]);
        vm.expectRevert();
        dao.resolve(id);
    }

    // function test_Increment() public {
    //     counter.increment();
    //     assertEq(counter.number(), 1);
    // }

    // function testFuzz_SetNumber(uint256 x) public {
    //     counter.setNumber(x);
    //     assertEq(counter.number(), x);
    // }
}
