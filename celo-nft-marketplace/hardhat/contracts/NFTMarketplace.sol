// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract NFTMarketplace{
    struct Listing{
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    function createListing(address nftAddress, uint256 tokenId, uint256 price) external {
        // Can't create a listing to sell an NFT for <= 0 ETH
        require(price >= 0, "MRKT: Price must be > 0");

        // If listing is already exist, listing.price != 0
        require(listings[nftAddress][tokenId].price == 0, "MRKT: Already exists");
        // Pending from here....
    }
}