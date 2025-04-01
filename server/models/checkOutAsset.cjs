// checkOutAsset.js
const Asset = require("./models/Asset"); // Import Asset model from your models

async function checkOutAsset(assetName) {
    try {
        // Update the checkedOut field for the asset
        const updatedAsset = await Asset.findOneAndUpdate(
            { name: assetName },
            { $set: { checkedOut: true } },
            { new: true } // Return the updated asset
        );

        if (!updatedAsset) {
            throw new Error("Asset not found");
        }

        return updatedAsset;
    } catch (error) {
        console.error("Error checking out asset:", error.message);
        throw error;
    }
}

module.exports = checkOutAsset;
