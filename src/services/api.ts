import { toast } from "@/components/ui/use-toast";

// Types based on MongoDB schemas
export interface Asset {
  id: string; // Used as unique identifier in frontend (will be MongoDB _id in production)
  commitId: number; // Most recent commit ID for the asset
  assetName: string;
  keywords: string[];
  checkedOut: boolean;
  checkedOutBy: string | null; // Store pennId of user who checked it out
  assetState: string;
  // Frontend-specific properties
  thumbnailUrl: string; // Will come from S3 in production
}

export interface Commit {
  commitId: number;
  pennKey: string; // Author's pennKey
  versionNum: string;
  description: string;
  lastCommitId: number | null;
  commitDate: string;
  hasMaterials: boolean;
}

export interface User {
  pennId: string;
  fullName: string;
  password: string; // Note: In production, passwords should never be exposed to frontend
}

// Combined asset data for frontend display
export interface AssetWithDetails {
  id: string;
  name: string;
  thumbnailUrl: string;
  version: string;
  creator: string;
  lastModifiedBy: string;
  checkedOutBy: string | null;
  isCheckedOut: boolean;
  materials: boolean;
  keywords: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for development
const mockUsers: User[] = [
  { pennId: "js123", fullName: "James Smith", password: "password" },
  { pennId: "ej456", fullName: "Emily Johnson", password: "password" },
  { pennId: "mb789", fullName: "Michael Brown", password: "password" },
  { pennId: "sw012", fullName: "Sarah Wilson", password: "password" }
];

const mockCommits: Commit[] = Array.from({ length: 50 }, (_, i) => ({
  commitId: i + 1,
  pennKey: mockUsers[i % 4].pennId,
  versionNum: `0${Math.floor(i / 10) + 1}.${Math.floor(i % 5)}.00`,
  description: `Update to asset ${Math.floor(i / 2) + 1}`,
  lastCommitId: i === 0 ? null : i,
  commitDate: new Date(Date.now() - ((i + 1) * 43200000)).toISOString(),
  hasMaterials: i % 3 === 0,
}));

const mockAssets: Asset[] = Array.from({ length: 20 }, (_, i) => {
  const assetCommits = mockCommits.filter(c => c.description.includes(`asset ${i + 1}`));
  const latestCommit = assetCommits.length > 0 ? assetCommits[0] : null;
  
  return {
    id: `asset-${i + 1}`,
    commitId: latestCommit?.commitId || 0,
    assetName: `Asset ${i + 1}`,
    keywords: ["3D", "Model", "Character", "Environment", "Prop", "Texture", "Animation"]
      .filter((_, ki) => ki % (i % 3 + 2) === 0),
    checkedOut: i % 5 === 0,
    checkedOutBy: i % 5 === 0 ? mockUsers[i % 4].pennId : null,
    assetState: "Active",
    thumbnailUrl: `https://placekitten.com/400/${300 + (i % 5) * 10}`,
  };
});

// Helper function to get user's full name by pennId
const getUserFullName = (pennId: string | null): string | null => {
  if (!pennId) return null;
  const user = mockUsers.find(u => u.pennId === pennId);
  return user ? user.fullName : null;
};

// Helper function to get commit by commitId
const getCommitById = (commitId: number): Commit | null => {
  return mockCommits.find(c => c.commitId === commitId) || null;
};

// Function to combine asset, commit, and user data for frontend
const getAssetWithDetails = (asset: Asset): AssetWithDetails => {
  const latestCommit = getCommitById(asset.commitId);
  const creatorCommit = mockCommits.filter(c => 
    c.description.includes(`asset ${asset.id.split('-')[1]}`)
  ).pop(); // Get the oldest commit for this asset
  
  return {
    id: asset.id,
    name: asset.assetName,
    thumbnailUrl: asset.thumbnailUrl,
    version: latestCommit?.versionNum || "01.00.00",
    creator: getUserFullName(creatorCommit?.pennKey || null) || "Unknown",
    lastModifiedBy: getUserFullName(latestCommit?.pennKey || null) || "Unknown",
    checkedOutBy: getUserFullName(asset.checkedOutBy) || null,
    isCheckedOut: asset.checkedOut,
    materials: latestCommit?.hasMaterials || false,
    keywords: asset.keywords,
    description: latestCommit?.description || "No description available",
    createdAt: creatorCommit?.commitDate || new Date().toISOString(),
    updatedAt: latestCommit?.commitDate || new Date().toISOString(),
  };
};

// Function to simulate API loading delay
const simulateApiDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// API functions that would connect to S3 and MongoDB in production
export const api = {
  // Get all assets with optional filtering
  async getAssets(params?: { search?: string; author?: string; checkedInOnly?: boolean; sortBy?: string }) {
    try {
      await simulateApiDelay();
      
      let filteredAssets = [...mockAssets];
      
      // Apply search filter
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        filteredAssets = filteredAssets.filter(asset => 
          asset.assetName.toLowerCase().includes(searchLower) || 
          asset.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
        );
      }
      
      // Convert to AssetWithDetails before applying author filter
      let assetsWithDetails = filteredAssets.map(getAssetWithDetails);
      
      // Apply author filter - now filtering on the "creator" field of AssetWithDetails
      if (params?.author) {
        assetsWithDetails = assetsWithDetails.filter(asset => 
          asset.creator === params.author
        );
      }
      
      // Apply checked-in filter
      if (params?.checkedInOnly) {
        assetsWithDetails = assetsWithDetails.filter(asset => !asset.isCheckedOut);
      }
      
      // Apply sorting
      if (params?.sortBy) {
        switch (params.sortBy) {
          case 'name':
            assetsWithDetails.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'author':
            assetsWithDetails.sort((a, b) => a.creator.localeCompare(b.creator));
            break;
          case 'updated':
            assetsWithDetails.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            break;
          case 'created':
            assetsWithDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          default:
            break;
        }
      }
      
      return { assets: assetsWithDetails };
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assets. Please try again.",
        variant: "destructive"
      });
      return { assets: [] };
    }
  },
  
  // Get a single asset by ID
  async getAsset(id: string) {
    try {
      await simulateApiDelay();
      const asset = mockAssets.find(a => a.id === id);
      
      if (!asset) {
        throw new Error("Asset not found");
      }
      
      const assetWithDetails = getAssetWithDetails(asset);
      return { asset: assetWithDetails };
    } catch (error) {
      console.error(`Failed to fetch asset ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to fetch asset details. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Check out an asset
  async checkoutAsset(id: string, userName: string) {
    try {
      await simulateApiDelay();
      const assetIndex = mockAssets.findIndex(a => a.id === id);
      
      if (assetIndex === -1) {
        throw new Error("Asset not found");
      }
      
      if (mockAssets[assetIndex].checkedOut) {
        const checkedOutByName = getUserFullName(mockAssets[assetIndex].checkedOutBy);
        throw new Error(`Asset is already checked out by ${checkedOutByName}`);
      }
      
      // Find user by name
      const user = mockUsers.find(u => u.fullName === userName);
      if (!user) {
        throw new Error("User not found");
      }
      
      // Update the asset (in a real app, this would update MongoDB)
      mockAssets[assetIndex] = {
        ...mockAssets[assetIndex],
        checkedOut: true,
        checkedOutBy: user.pennId
      };
      
      return { asset: getAssetWithDetails(mockAssets[assetIndex]) };
    } catch (error) {
      console.error(`Failed to check out asset ${id}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check out asset.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Check in an asset
  async checkinAsset(id: string, userName: string) {
    try {
      await simulateApiDelay();
      const assetIndex = mockAssets.findIndex(a => a.id === id);
      
      if (assetIndex === -1) {
        throw new Error("Asset not found");
      }
      
      if (!mockAssets[assetIndex].checkedOut) {
        throw new Error("Asset is not checked out");
      }
      
      // Find user by name
      const user = mockUsers.find(u => u.fullName === userName);
      if (!user) {
        throw new Error("User not found");
      }
      
      // Verify the user who's checking in is the one who checked out
      if (mockAssets[assetIndex].checkedOutBy !== user.pennId) {
        const checkedOutByName = getUserFullName(mockAssets[assetIndex].checkedOutBy);
        throw new Error(`Asset is checked out by ${checkedOutByName}, not you`);
      }
      
      // Create a new commit for this check-in
      const lastCommit = getCommitById(mockAssets[assetIndex].commitId);
      if (!lastCommit) {
        throw new Error("Could not find the last commit");
      }
      
      // Update version (simplified for mock)
      const versionParts = lastCommit.versionNum.split('.');
      const minorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${versionParts[0]}.${minorVersion.toString().padStart(2, '0')}.00`;
      
      // Create a new commit
      const newCommitId = mockCommits.length + 1;
      const newCommit: Commit = {
        commitId: newCommitId,
        pennKey: user.pennId,
        versionNum: newVersion,
        description: `Update to ${mockAssets[assetIndex].assetName}`,
        lastCommitId: lastCommit.commitId,
        commitDate: new Date().toISOString(),
        hasMaterials: lastCommit.hasMaterials
      };
      
      // Add the new commit to mock data
      mockCommits.unshift(newCommit);
      
      // Update the asset with the new commit ID
      mockAssets[assetIndex] = {
        ...mockAssets[assetIndex],
        commitId: newCommitId,
        checkedOut: false,
        checkedOutBy: null
      };
      
      return { asset: getAssetWithDetails(mockAssets[assetIndex]) };
    } catch (error) {
      console.error(`Failed to check in asset ${id}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check in asset.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Download a copy of the asset (in a real app, this would fetch from S3)
  async downloadAsset(id: string) {
    try {
      await simulateApiDelay();
      const asset = mockAssets.find(a => a.id === id);
      
      if (!asset) {
        throw new Error("Asset not found");
      }
      
      // In a real app, this would trigger a download from S3
      console.log(`Downloading asset ${id}: ${asset.assetName}`);
      
      toast({
        title: "Download Started",
        description: `${asset.assetName} is being downloaded.`,
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Failed to download asset ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to download asset. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Launch DCC (Digital Content Creation) app with the asset
  async launchDCC(id: string) {
    try {
      await simulateApiDelay();
      const asset = mockAssets.find(a => a.id === id);
      
      if (!asset) {
        throw new Error("Asset not found");
      }
      
      // In a real app, this would launch an external application
      console.log(`Launching DCC with asset ${id}: ${asset.assetName}`);
      
      toast({
        title: "Launching Application",
        description: `Opening ${asset.assetName} in the content creation app.`,
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Failed to launch DCC for asset ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to launch application. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Get all unique authors from assets
  async getAuthors() {
    try {
      await simulateApiDelay();
      
      // Extract unique authors from our mock data
      return { authors: mockUsers.map(user => user.fullName) };
    } catch (error) {
      console.error("Failed to fetch authors:", error);
      toast({
        title: "Error",
        description: "Failed to load author list. Please try again.",
        variant: "destructive"
      });
      return { authors: [] };
    }
  }
};
