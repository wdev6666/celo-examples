// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace{
    struct Listing{
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    // Requires the msg.sender is the owner of the specified NFT
    modifier isNFTOwner(address nftAddress, uint256 tokenId){
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "MRKT: Not the owner");
        _;
    }

    // Requires that the specified NFT is not already listed for sale
    modifier isNotListed(address nftAddress, uint256 tokenId){
        require(listings[nftAddress][tokenId].price == 0, "MRKT: Address already listed");
        _;
    }

    // Requires a specified address already listed for sale
    modifier isListed(address nftAddress, uint256 tokenId){
        require(listings[nftAddress][tokenId].price > 0, "MRKT: Address not listed");
        _;
    }

    // Event for Listing Created
    event ListingCreated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    // Event for Listing Cancelled
    event ListingCancelled(
        address nftAddress,
        uint256 tokenId,
        address seller
    );

    event ListingUpdated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    event ListingPurchased(
        address nftAddress,
        uint256 tokenId,
        address seller,
        address buyer
    );

    function createListing(address nftAddress, uint256 tokenId, uint256 price) external isNotListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId) {
        
        // Can't create a listing to sell an NFT for <= 0 ETH
        require(price >= 0, "MRKT: Price must be > 0");

        // Check if caller is the owner of NFT and authorized to transfer
        IERC721 nftContract = IERC721(nftAddress);
        require(nftContract.isApprovedForAll(msg.sender, address(this)) || nftContract.getApproved(tokenId) == address(this), "MRKT: No approval for NFT");
        
        // Add the listing to mapping
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit ListingCreated(nftAddress, tokenId, price, msg.sender);
    }

    function cancelListing(address nftAddress, uint256 tokenId, address seller) external isListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId){
        
        // Delete listing struct from the mapping
        // Freeing up storage gas
        delete listings[nftAddress][tokenId];
        emit ListingCancelled(nftAddress, tokenId, msg.sender);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) external isListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId){

        // Can't update price <= 0
        require(newPrice > 0, "MRKT: Price must be > 0");

        // Update listing price
        listings[nftAddress][tokenId].price = newPrice;

        //Emit ListingUpdated event
        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    function purchaseListing(address nftAddress, uint256 tokenId) external payable isListed(nftAddress, tokenId) {
        
        // Load the listing in a local copy
        Listing memory listing = listings[nftAddress][tokenId];

        // Buyer must have enough ETH
        require(msg.value == listing.price, "MRKT: Incorrect ETH supplied");

        // Delete listing from storage and save some gas
        delete listings[nftAddress][tokenId];

        // Transfer NFT
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer ETH
        payable(listing.seller).transfer(msg.value);

        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }
}