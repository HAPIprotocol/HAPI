pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./libraries/TransferHelper.sol";

contract Airdrop {
    using SafeMath for uint;
    using SafeERC20 for IERC20;

    IERC20 immutable token;
    
    constructor(address _token) public {
        token = IERC20(_token);
    }

    function transfer(address[] calldata _addresses, uint[] calldata _amounts, uint total) external {
        require(_addresses.length == _amounts.length, 'Airdrop: INVALID');
        token.safeTransferFrom(msg.sender, address(this), total);
        uint sum;
        for (uint i; i < _addresses.length; ++i) {
            token.safeTransfer(_addresses[i], _amounts[i]);
            sum = sum.add(_amounts[i]);
        }
        require(sum == total, 'Airdrop: TOTAL');
    }
}