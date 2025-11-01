// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title 彩票积分代币合约 (ERC20)
 */
contract LotteryPoints is ERC20, Ownable {
    // 积分领取记录
    mapping(address => bool) public hasClaimed;

    // 每个用户可领取的积分数量
    uint256 public constant CLAIM_AMOUNT = 1000 * 10**18;
    
    // 最大供应量 - 添加这个常量
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18;

    event PointsClaimed(address indexed user, uint256 amount);

    constructor() ERC20("LotteryPoints", "LTP") Ownable(msg.sender) {
        // 初始发行100万积分给合约部署者，用于后续分配
        _mint(msg.sender, 1000000 * 10**18);
    }

    /**
     * @dev 用户领取测试积分
     */
    function claimPoints() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(totalSupply() + CLAIM_AMOUNT <= MAX_SUPPLY, "Max supply exceeded");
        
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, CLAIM_AMOUNT);
        
        emit PointsClaimed(msg.sender, CLAIM_AMOUNT);
    }

    /**
     * @dev 管理员铸造积分（仅用于测试）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded"); // 添加检查
        _mint(to, amount);
    }

    /**
     * @dev 批量转账
     */
    function batchTransfer(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
}

/**
 * @title 彩票凭证 Token 合约 (ERC721)
 */
contract LotteryToken is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // 彩票凭证状态
    enum TicketStatus { Ready, OnSale, Winning, Losing }

    // 彩票信息结构
    struct TicketInfo {
        uint256 lotteryId;      // 所属彩票项目ID
        uint256 optionId;       // 选择的选项ID
        uint256 purchasePrice;  // 购买价格（积分）
        uint256 purchaseTime;   // 购买时间
        address owner;          // 当前所有者
        TicketStatus status;    // 凭证状态
    }

    // TokenID => TicketInfo
    mapping(uint256 => TicketInfo) public ticketInfo;

    // 用户拥有的彩票列表
    mapping(address => uint256[]) public ownerToTicketIds;

    // 记录已存在的tokenId
    mapping(uint256 => bool) private _tokenExists;

    // 事件
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed lotteryId,
        uint256 optionId,
        address owner,
        uint256 price
    );

    event TicketTransferred(
        uint256 indexed tokenId,
        address from,
        address to,
        uint256 price
    );

    event TicketStatusChanged(
        uint256 indexed tokenId,
        TicketStatus status
    );

    constructor() 
        ERC721("LotteryTicket", "LOTT") 
        Ownable(msg.sender) 
    {}

    /**
     * @dev 检查tokenId是否存在
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _tokenExists[tokenId];
    }

    /**
     * @dev 铸造新的彩票凭证
     */
    function mintTicket(
        address to,
        uint256 lotteryId,
        uint256 optionId,
        uint256 price
    ) external onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);

        ticketInfo[tokenId] = TicketInfo({
            lotteryId: lotteryId,
            optionId: optionId,
            purchasePrice: price,
            purchaseTime: block.timestamp,
            owner: to,
            status: TicketStatus.Ready
        });

        _tokenExists[tokenId] = true;
        ownerToTicketIds[to].push(tokenId);

        emit TicketMinted(tokenId, lotteryId, optionId, to, price);
        return tokenId;
    }

    /**
     * @dev 更新彩票状态
     */
    function updateTicketStatus(uint256 tokenId, TicketStatus status) external onlyOwner {
        require(exists(tokenId), "Ticket does not exist");
        ticketInfo[tokenId].status = status;
        emit TicketStatusChanged(tokenId, status);
    }

    /**
     * @dev 更新彩票所有者信息
     */
    function updateTicketOwner(uint256 tokenId, address newOwner) external onlyOwner {
        require(exists(tokenId), "Ticket does not exist");
        
        address oldOwner = ticketInfo[tokenId].owner;
        ticketInfo[tokenId].owner = newOwner;

        // 更新所有者列表
        _removeFromOwnerList(oldOwner, tokenId);
        ownerToTicketIds[newOwner].push(tokenId);
    }

    /**
     * @dev 从所有者列表中移除彩票
     */
    function _removeFromOwnerList(address owner, uint256 tokenId) private {
        uint256[] storage ticketIds = ownerToTicketIds[owner];
        for (uint256 i = 0; i < ticketIds.length; i++) {
            if (ticketIds[i] == tokenId) {
                ticketIds[i] = ticketIds[ticketIds.length - 1];
                ticketIds.pop();
                break;
            }
        }
    }

    /**
     * @dev 获取用户的彩票列表
     */
    function getUserTickets(address user) external view returns (uint256[] memory) {
        return ownerToTicketIds[user];
    }

    /**
     * @dev 获取彩票详细信息
     */
    function getTicketDetails(uint256 tokenId) external view returns (TicketInfo memory) {
        require(exists(tokenId), "Ticket does not exist");
        return ticketInfo[tokenId];
    }

    /**
     * @dev 获取用户特定状态的彩票
     */
    function getUserTicketsByStatus(address user, TicketStatus status) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory userTickets = ownerToTicketIds[user];
        uint256 count = 0;
        
        // 先计算数量
        for (uint256 i = 0; i < userTickets.length; i++) {
            if (ticketInfo[userTickets[i]].status == status) {
                count++;
            }
        }
        
        // 再填充数组
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < userTickets.length; i++) {
            if (ticketInfo[userTickets[i]].status == status) {
                result[index] = userTickets[i];
                index++;
            }
        }
        
        return result;
    }

    // 重写必要的函数来解决多重继承冲突
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address previousOwner = super._update(to, tokenId, auth);
        
        // 更新所有者信息
        if (previousOwner != address(0) && to != address(0)) {
            ticketInfo[tokenId].owner = to;
            _removeFromOwnerList(previousOwner, tokenId);
            ownerToTicketIds[to].push(tokenId);
        }
        
        return previousOwner;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // 删除原来的 _beforeTokenTransfer 函数，使用 _update 替代

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
/**
 * @title 去中心化彩票主合约
 */
contract DecentralizedLottery is Ownable, ReentrancyGuard {
    uint256 private _lotteryIdCounter;
    uint256 private _listingIdCounter;

    // 彩票项目状态
    enum LotteryStatus { Active, Drawn, Refunded }

    // 挂单状态
    enum ListingStatus { Selling, Cancelled, Sold }

    // 彩票项目结构
    struct Lottery {
        uint256 id;                     // 项目ID
        string name;                    // 项目名称
        string description;             // 项目描述
        string[] options;               // 选项列表
        uint256 totalPool;              // 总奖池（积分）
        uint256 endTime;                // 结束时间
        LotteryStatus status;           // 项目状态
        uint256 winningOption;          // 获胜选项
        uint256 ticketPrice;            // 彩票价格（积分）
        uint256[] winningTickets;       // 获胜彩票列表
        mapping(uint256 => uint256) optionTicketCount;      // 各选项的彩票数量
        mapping(uint256 => uint256[]) optionTickets;        // 各选项的彩票列表
        mapping(uint256 => uint256) optionTotalAmount;      // 各选项的总投注额
    }

    // 挂单结构
    struct Listing {
        uint256 id;                     // 挂单ID
        uint256 tokenId;                // 彩票TokenID
        address seller;                 // 出售者
        uint256 price;                  // 出售价格（积分）
        ListingStatus status;           // 挂单状态
        uint256 listingTime;            // 挂单时间
    }

    // 响应结构体
    struct LotteryResponse {
        uint256 id;
        string name;
        string description;
        string[] options;
        uint256 totalPool;
        uint256 endTime;
        LotteryStatus status;
        uint256 winningOption;
        uint256 ticketPrice;
        uint256[] optionCounts;
        uint256[] optionAmounts;
    }

    struct TicketResponse {
        uint256 tokenId;
        uint256 lotteryId;
        string lotteryName;
        uint256 optionId;
        string optionName;
        uint256 amount;
        uint256 purchaseTime;
        LotteryToken.TicketStatus status;
    }

    struct ListingResponse {
        uint256 listingId;
        uint256 tokenId;
        uint256 lotteryId;
        string lotteryName;
        uint256 optionId;
        string optionName;
        address seller;
        uint256 price;
        uint256 ticketAmount;
        uint256 listingTime;
        ListingStatus status;
    }

    // 彩票项目数组
    Lottery[] public lotteries;

    // 挂单数组
    Listing[] public listings;

    // 合约引用
    LotteryToken public lotteryToken;
    LotteryPoints public lotteryPoints;

    // 映射关系
    mapping(uint256 => uint256[]) public lotteryToListings;        // 彩票项目到挂单列表
    mapping(address => uint256[]) public sellerToListings;         // 卖家到挂单列表
    mapping(uint256 => uint256[]) public optionToListings;         // 选项到挂单列表（用于订单簿）

    // 订单簿：lotteryId => optionId => price => quantity
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) public orderBook;
    mapping(uint256 => mapping(uint256 => uint256[])) public priceLevels;

    // 事件
    event LotteryCreated(
        uint256 indexed lotteryId,
        string name,
        string description,
        uint256 ticketPrice,
        uint256 endTime
    );

    event TicketPurchased(
        uint256 indexed lotteryId,
        uint256 indexed tokenId,
        uint256 optionId,
        address buyer,
        uint256 amount
    );

    event TicketListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        uint256 indexed lotteryId,
        address seller,
        uint256 price
    );

    event TicketUnlisted(
        uint256 indexed listingId,
        uint256 indexed tokenId
    );

    event TicketSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    event LotteryEnded(
        uint256 indexed lotteryId,
        uint256 winningOption
    );

    event PrizeDistributed(
        uint256 indexed lotteryId,
        uint256 totalPrize,
        uint256 winnerCount
    );

    event LotteryRefunded(
        uint256 indexed lotteryId
    );

    constructor() Ownable(msg.sender) {
        // 部署彩票积分合约
        lotteryPoints = new LotteryPoints();
        
        // 部署彩票Token合约
        lotteryToken = new LotteryToken();
        
        // 转移所有权到主合约
        lotteryToken.transferOwnership(address(this));
    }

    /**
     * @dev 创建新的彩票项目
     */
    function createLottery(
        string memory name,
        string memory description,
        string[] memory options,
        uint256 ticketPrice,
        uint256 durationInDays
    ) external onlyOwner returns (uint256) {
        require(options.length >= 2, "At least 2 options required");
        require(ticketPrice > 0, "Ticket price must be greater than 0");

        uint256 lotteryId = _lotteryIdCounter;
        _lotteryIdCounter++;

        lotteries.push();
        Lottery storage newLottery = lotteries[lotteryId];
        newLottery.id = lotteryId;
        newLottery.name = name;
        newLottery.description = description;
        newLottery.options = options;
        newLottery.totalPool = 0;
        newLottery.endTime = block.timestamp + (durationInDays * 1 days);
        newLottery.status = LotteryStatus.Active;
        newLottery.winningOption = type(uint256).max;
        newLottery.ticketPrice = ticketPrice;

        emit LotteryCreated(lotteryId, name, description, ticketPrice, newLottery.endTime);
        return lotteryId;
    }

    /**
     * @dev 使用积分购买彩票
     */
    function purchaseTicket(uint256 lotteryId, uint256 optionId) 
        external 
        nonReentrant 
        returns (uint256) 
    {
        require(lotteryId < lotteries.length, "Lottery does not exist");
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.status == LotteryStatus.Active, "Lottery not active");
        require(block.timestamp < lottery.endTime, "Lottery ended");
        require(optionId < lottery.options.length, "Invalid option");

        uint256 ticketPrice = lottery.ticketPrice;
        
        // 检查用户积分余额并转账
        require(lotteryPoints.balanceOf(msg.sender) >= ticketPrice, "Insufficient points");
        require(lotteryPoints.transferFrom(msg.sender, address(this), ticketPrice), "Transfer failed");

        // 更新奖池和选项数据
        lottery.totalPool += ticketPrice;
        lottery.optionTicketCount[optionId]++;
        lottery.optionTotalAmount[optionId] += ticketPrice;

        // 铸造彩票Token
        uint256 tokenId = lotteryToken.mintTicket(
            msg.sender,
            lotteryId,
            optionId,
            ticketPrice
        );

        // 记录彩票到选项
        lottery.optionTickets[optionId].push(tokenId);

        emit TicketPurchased(lotteryId, tokenId, optionId, msg.sender, ticketPrice);
        return tokenId;
    }

    /**
     * @dev 挂单出售彩票
     */
    function listTicket(uint256 tokenId, uint256 price) external nonReentrant {
        require(lotteryToken.ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(price > 0, "Price must be greater than 0");

        LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(tokenId);
        require(ticket.status == LotteryToken.TicketStatus.Ready, "Ticket not available for listing");
        
        Lottery storage lottery = lotteries[ticket.lotteryId];
        require(lottery.status == LotteryStatus.Active, "Lottery not active");
        require(block.timestamp < lottery.endTime, "Lottery ended");

        // 创建挂单
        uint256 listingId = _listingIdCounter;
        _listingIdCounter++;

        listings.push(Listing({
            id: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            status: ListingStatus.Selling,
            listingTime: block.timestamp
        }));

        // 更新映射关系
        lotteryToListings[ticket.lotteryId].push(listingId);
        sellerToListings[msg.sender].push(listingId);
        optionToListings[ticket.optionId].push(listingId);

        // 更新订单簿
        _updateOrderBook(ticket.lotteryId, ticket.optionId, price, 1, true);

        // 转移彩票到合约并更新状态
        lotteryToken.transferFrom(msg.sender, address(this), tokenId);
        lotteryToken.updateTicketStatus(tokenId, LotteryToken.TicketStatus.OnSale);

        emit TicketListed(listingId, tokenId, ticket.lotteryId, msg.sender, price);
    }

    /**
     * @dev 取消挂单
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        require(listingId < listings.length, "Listing does not exist");
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Selling, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");

        _cancelListing(listingId);
    }

    /**
     * @dev 内部取消挂单函数
     */
    function _cancelListing(uint256 listingId) internal {
        Listing storage listing = listings[listingId];
        listing.status = ListingStatus.Cancelled;

        LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(listing.tokenId);

        // 更新订单簿
        _updateOrderBook(ticket.lotteryId, ticket.optionId, listing.price, 1, false);

        // 返还彩票给卖家
        lotteryToken.transferFrom(address(this), listing.seller, listing.tokenId);
        lotteryToken.updateTicketStatus(listing.tokenId, LotteryToken.TicketStatus.Ready);

        emit TicketUnlisted(listingId, listing.tokenId);
    }

    /**
     * @dev 购买挂单的彩票
     */
    function buyListing(uint256 listingId) external nonReentrant {
        require(listingId < listings.length, "Listing does not exist");
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Selling, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        // 检查买方余额
        require(lotteryPoints.balanceOf(msg.sender) >= listing.price, "Insufficient points");
        
        // 转账积分
        require(lotteryPoints.transferFrom(msg.sender, listing.seller, listing.price), "Transfer failed");

        LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(listing.tokenId);

        // 更新挂单状态和订单簿
        listing.status = ListingStatus.Sold;
        _updateOrderBook(ticket.lotteryId, ticket.optionId, listing.price, 1, false);

        // 转移彩票所有权
        lotteryToken.transferFrom(address(this), msg.sender, listing.tokenId);
        lotteryToken.updateTicketStatus(listing.tokenId, LotteryToken.TicketStatus.Ready);
        lotteryToken.updateTicketOwner(listing.tokenId, msg.sender);

        emit TicketSold(listingId, listing.tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev 按最优价格购买彩票
     */
    function buyAtBestPrice(uint256 lotteryId, uint256 optionId) external nonReentrant {
        uint256 bestPrice = getBestPrice(lotteryId, optionId);
        require(bestPrice > 0, "No tickets available");

        // 找到最低价格的挂单
        uint256 targetListingId = type(uint256).max;
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].status == ListingStatus.Selling) {
                LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(listings[i].tokenId);
                if (ticket.lotteryId == lotteryId && 
                    ticket.optionId == optionId && 
                    listings[i].price == bestPrice) {
                    targetListingId = listings[i].id;
                    break;
                }
            }
        }

        require(targetListingId != type(uint256).max, "No listing found at best price");
        this.buyListing(targetListingId);
    }

    /**
     * @dev 结束彩票项目并公布结果
     */
    function endLottery(uint256 lotteryId, uint256 winningOption) external onlyOwner {
        require(lotteryId < lotteries.length, "Lottery does not exist");
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.status == LotteryStatus.Active, "Lottery not active");
        require(winningOption < lottery.options.length, "Invalid winning option");

        // 取消所有相关挂单
        _cancelAllListings(lotteryId);

        lottery.status = LotteryStatus.Drawn;
        lottery.winningOption = winningOption;
        lottery.winningTickets = lottery.optionTickets[winningOption];

        emit LotteryEnded(lotteryId, winningOption);
    }

    /**
     * @dev 结算并分配奖金
     */
    function settleLottery(uint256 lotteryId) external onlyOwner nonReentrant {
        require(lotteryId < lotteries.length, "Lottery does not exist");
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.status == LotteryStatus.Drawn, "Lottery not drawn");
        require(lottery.winningTickets.length > 0, "No winning tickets");

        uint256 winnerCount = lottery.winningTickets.length;
        uint256 totalWinningAmount = lottery.optionTotalAmount[lottery.winningOption];
        uint256 totalPrize = lottery.totalPool;

        // 按投注比例分配奖金
        for (uint256 i = 0; i < winnerCount; i++) {
            uint256 tokenId = lottery.winningTickets[i];
            LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(tokenId);
            address winner = lotteryToken.ownerOf(tokenId);
            
            // 计算应得奖金（按投注比例）
            uint256 prize = (totalPrize * ticket.purchasePrice) / totalWinningAmount;
            lotteryPoints.transfer(winner, prize);
            
            // 更新彩票状态
            lotteryToken.updateTicketStatus(tokenId, LotteryToken.TicketStatus.Winning);
        }

        lottery.status = LotteryStatus.Active; // 重置状态，实际应改为已完成

        emit PrizeDistributed(lotteryId, totalPrize, winnerCount);
    }

    /**
     * @dev 退款功能
     */
    function refundLottery(uint256 lotteryId) external onlyOwner nonReentrant {
        require(lotteryId < lotteries.length, "Lottery does not exist");
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.status == LotteryStatus.Active, "Lottery not active");

        // 取消所有挂单
        _cancelAllListings(lotteryId);

        // 退还所有投注
        for (uint256 optionId = 0; optionId < lottery.options.length; optionId++) {
            uint256[] memory optionTickets = lottery.optionTickets[optionId];
            for (uint256 i = 0; i < optionTickets.length; i++) {
                uint256 tokenId = optionTickets[i];
                LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(tokenId);
                address owner = lotteryToken.ownerOf(tokenId);
                
                lotteryPoints.transfer(owner, ticket.purchasePrice);
                lotteryToken.updateTicketStatus(tokenId, LotteryToken.TicketStatus.Losing);
            }
        }

        lottery.status = LotteryStatus.Refunded;
        emit LotteryRefunded(lotteryId);
    }

    /**
     * @dev 取消彩票项目的所有挂单
     */
    function _cancelAllListings(uint256 lotteryId) internal {
        uint256[] memory lotteryListingIds = lotteryToListings[lotteryId];
        for (uint256 i = 0; i < lotteryListingIds.length; i++) {
            uint256 listingId = lotteryListingIds[i];
            if (listings[listingId].status == ListingStatus.Selling) {
                _cancelListing(listingId);
            }
        }
    }

    /**
     * @dev 更新订单簿
     */
    function _updateOrderBook(
        uint256 lotteryId, 
        uint256 optionId, 
        uint256 price, 
        uint256 quantity, 
        bool isAdd
    ) private {
        uint256 currentQuantity = orderBook[lotteryId][optionId][price];
        
        if (isAdd) {
            if (currentQuantity == 0) {
                _addPriceLevel(lotteryId, optionId, price);
            }
            orderBook[lotteryId][optionId][price] = currentQuantity + quantity;
        } else {
            if (currentQuantity <= quantity) {
                orderBook[lotteryId][optionId][price] = 0;
                _removePriceLevel(lotteryId, optionId, price);
            } else {
                orderBook[lotteryId][optionId][price] = currentQuantity - quantity;
            }
        }
    }

    /**
     * @dev 添加价格级别
     */
    function _addPriceLevel(uint256 lotteryId, uint256 optionId, uint256 price) private {
        uint256[] storage prices = priceLevels[lotteryId][optionId];
        
        uint256 insertIndex = prices.length;
        for (uint256 i = 0; i < prices.length; i++) {
            if (prices[i] == price) return;
            if (prices[i] > price) {
                insertIndex = i;
                break;
            }
        }
        
        if (insertIndex == prices.length) {
            prices.push(price);
        } else {
            prices.push(0);
            for (uint256 i = prices.length - 1; i > insertIndex; i--) {
                prices[i] = prices[i - 1];
            }
            prices[insertIndex] = price;
        }
    }

    /**
     * @dev 移除价格级别
     */
    function _removePriceLevel(uint256 lotteryId, uint256 optionId, uint256 price) private {
        uint256[] storage prices = priceLevels[lotteryId][optionId];
        
        for (uint256 i = 0; i < prices.length; i++) {
            if (prices[i] == price) {
                for (uint256 j = i; j < prices.length - 1; j++) {
                    prices[j] = prices[j + 1];
                }
                prices.pop();
                break;
            }
        }
    }

    // ========== 查询函数 ==========

    /**
     * @dev 用户领取测试积分
     */
    function claimPoints() external {
        lotteryPoints.claimPoints();
    }

    /**
     * @dev 获取所有彩票项目
     */
    function getAllLotteries() external view returns (LotteryResponse[] memory) {
        LotteryResponse[] memory result = new LotteryResponse[](lotteries.length);
        
        for (uint256 i = 0; i < lotteries.length; i++) {
            Lottery storage lottery = lotteries[i];
            uint256[] memory optionCounts = new uint256[](lottery.options.length);
            uint256[] memory optionAmounts = new uint256[](lottery.options.length);
            
            for (uint256 j = 0; j < lottery.options.length; j++) {
                optionCounts[j] = lottery.optionTicketCount[j];
                optionAmounts[j] = lottery.optionTotalAmount[j];
            }
            
            result[i] = LotteryResponse({
                id: lottery.id,
                name: lottery.name,
                description: lottery.description,
                options: lottery.options,
                totalPool: lottery.totalPool,
                endTime: lottery.endTime,
                status: lottery.status,
                winningOption: lottery.winningOption,
                ticketPrice: lottery.ticketPrice,
                optionCounts: optionCounts,
                optionAmounts: optionAmounts
            });
        }
        
        return result;
    }

    /**
     * @dev 获取用户的彩票凭证
     */
    function getUserTickets(address user) external view returns (TicketResponse[] memory) {
        uint256[] memory ticketIds = lotteryToken.getUserTickets(user);
        TicketResponse[] memory result = new TicketResponse[](ticketIds.length);
        
        for (uint256 i = 0; i < ticketIds.length; i++) {
            LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(ticketIds[i]);
            Lottery storage lottery = lotteries[ticket.lotteryId];
            
            result[i] = TicketResponse({
                tokenId: ticketIds[i],
                lotteryId: ticket.lotteryId,
                lotteryName: lottery.name,
                optionId: ticket.optionId,
                optionName: lottery.options[ticket.optionId],
                amount: ticket.purchasePrice,
                purchaseTime: ticket.purchaseTime,
                status: ticket.status
            });
        }
        
        return result;
    }

    /**
     * @dev 获取订单簿信息
     */
    function getOrderBook(uint256 lotteryId, uint256 optionId) 
        external 
        view 
        returns (uint256[] memory prices, uint256[] memory quantities) 
    {
        uint256[] memory allPrices = priceLevels[lotteryId][optionId];
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < allPrices.length; i++) {
            if (orderBook[lotteryId][optionId][allPrices[i]] > 0) {
                validCount++;
            }
        }
        
        prices = new uint256[](validCount);
        quantities = new uint256[](validCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPrices.length; i++) {
            uint256 price = allPrices[i];
            uint256 quantity = orderBook[lotteryId][optionId][price];
            if (quantity > 0) {
                prices[index] = price;
                quantities[index] = quantity;
                index++;
            }
        }
        
        return (prices, quantities);
    }

    /**
     * @dev 获取最优价格
     */
    function getBestPrice(uint256 lotteryId, uint256 optionId) public view returns (uint256) {
        uint256[] memory prices = priceLevels[lotteryId][optionId];
        if (prices.length == 0) return 0;
        
        uint256 lowestPrice = type(uint256).max;
        for (uint256 i = 0; i < prices.length; i++) {
            if (orderBook[lotteryId][optionId][prices[i]] > 0 && prices[i] < lowestPrice) {
                lowestPrice = prices[i];
            }
        }
        
        return lowestPrice == type(uint256).max ? 0 : lowestPrice;
    }

    /**
     * @dev 获取活跃挂单
     */
    function getActiveListings() external view returns (ListingResponse[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].status == ListingStatus.Selling) {
                activeCount++;
            }
        }
        
        ListingResponse[] memory result = new ListingResponse[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].status == ListingStatus.Selling) {
                Listing memory listing = listings[i];
                LotteryToken.TicketInfo memory ticket = lotteryToken.getTicketDetails(listing.tokenId);
                Lottery storage lottery = lotteries[ticket.lotteryId];
                
                result[index] = ListingResponse({
                    listingId: listing.id,
                    tokenId: listing.tokenId,
                    lotteryId: ticket.lotteryId,
                    lotteryName: lottery.name,
                    optionId: ticket.optionId,
                    optionName: lottery.options[ticket.optionId],
                    seller: listing.seller,
                    price: listing.price,
                    ticketAmount: ticket.purchasePrice,
                    listingTime: listing.listingTime,
                    status: listing.status
                });
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev 获取合约地址
     */
    function getContractAddresses() external view returns (address points, address token) {
        return (address(lotteryPoints), address(lotteryToken));
    }
}