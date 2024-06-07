// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bridge is OwnableUpgradeable, ReentrancyGuardUpgradeable {

    address public minter;
    mapping(address => bool) public whitelistTokens;
    mapping(string => bool) public unlockHash;
    uint256 public maxAmount;
    uint256 public minAmount;

    event Lock(address locker, string receipt, address token, uint256 amount, string tokenName);
    event Unlock(address user, address token, uint256 amount, string hash, uint256 fee);
    event ChangeMinter(address minter);
    event ChangeMinAmount(uint256 minAmount);
    event ChangeMaxAmount(uint256 maxAmount);
    event SetWhitelistToken(address token, bool whitelist);

    modifier onlyMinter() {
        require(minter == msg.sender, "Bridge: Only Minter");
        _;
    }

    function initialize(
        address _minter,
        uint256 _minAmount,
        uint256 _maxAmount
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        minter = _minter;
        minAmount = _minAmount;
        maxAmount = _maxAmount;
        emit ChangeMinter(minter);
    }

    function lock(address token, string memory receipt, uint256 amount) public payable {
        require(whitelistTokens[token], "Bridge: token must be in whitelist");
        require(amount <= maxAmount && amount >= minAmount, "Bridge: invalid amount");
        string memory name = "ETH";
        if (token == address(0)) {
            require(msg.value == amount, "Bridge: invalid amount");
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            name = IERC20(token).name();
        }
        emit Lock(msg.sender, receipt, token, amount, name);
    }


    function unlock(address token, uint256 amount, address user, string memory hash, uint256 fee) public onlyMinter nonReentrant {
        require(whitelistTokens[token], "Bridge: token must be in whitelist");
        require(!unlockHash[hash], "Bridge: Unlocked before");
        unlockHash[hash] = true;
        if (token == address(0)) {
            require(address(this).balance >= amount, "Bridge: invalid amount");
            payable(user).transfer(amount - fee);
            payable(owner()).transfer(fee);

        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Bridge: Invalid amount");
            IERC20(token).transfer(user, amount - fee);
            IERC20(token).transfer(owner(), fee);

        }
        emit Unlock(user, token, amount - fee, hash, fee);
    }

//    ------------ADMIN FUNCTIONS--------------------------------
    function changeMinter(address _minter) public onlyOwner {
        minter = _minter;
        emit ChangeMinter(minter);
    }

    function setWhitelistToken(address token, bool whitelist) public onlyOwner {
        whitelistTokens[token] = whitelist;
        emit SetWhitelistToken(token, whitelist);
    }

    function setMinAmount(uint256 min) public onlyOwner {
        require(min <= maxAmount, "Invalid minAmount");
        minAmount = min;
        emit ChangeMinAmount(minAmount);
    }

    function setMaxAmount(uint256 max) public onlyOwner {
        require(max >= minAmount, "Invalid minAmount");
        maxAmount = max;
        emit ChangeMaxAmount(maxAmount);
    }
}
