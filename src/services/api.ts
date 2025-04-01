import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";

// Types based on MongoDB schemas
export interface Asset {
  assetName: string; // Changed from assetId
  keywords: string[];
  checkedOut: boolean;
  latestCommitId: string; // Changed from number to string
  lastApprovedId: string; // Changed from number to string
  // Frontend-specific properties
  thumbnailUrl: string; // Will come from S3 in production
}

export interface Commit {
  commitId: string; // Changed from number to string
  pennKey: string; // Author's pennKey
  versionNum: string;
  notes: string; // Updated from description
  prevCommitId: string | null; // Updated from number to string
  commitDate: string;
  hasMaterials: boolean;
  state: string[]; // Added from schema
}

export interface User {
  pennId: string;
  fullName: string;
  password: string; // Note: In production, passwords should never be exposed to frontend
}

// Combined asset data for frontend display
export interface AssetWithDetails {
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
  commitId: (i + 1).toString(),
  pennKey: mockUsers[i % 4].pennId,
  versionNum: `0${Math.floor(i / 10) + 1}.${Math.floor(i % 5)}.00`,
  notes: `Update to asset ${Math.floor(i / 2) + 1}`,
  prevCommitId: i === 0 ? null : i.toString(),
  commitDate: new Date(Date.now() - ((i + 1) * 43200000)).toISOString(),
  hasMaterials: i % 3 === 0,
  state: [],
}));

const mockAssets: Asset[] = Array.from({ length: 20 }, (_, i) => {
  const assetCommits = mockCommits.filter(c => c.notes.includes(`asset ${i + 1}`));
  const latestCommit = assetCommits.length > 0 ? assetCommits[0] : null;
  
  return {
    assetName: `Asset ${i + 1}`,
    keywords: ["3D", "Model", "Character", "Environment", "Prop", "Texture", "Animation"]
      .filter((_, ki) => ki % (i % 3 + 2) === 0),
    checkedOut: i % 5 === 0,
    latestCommitId: latestCommit?.commitId || "0",
    lastApprovedId: latestCommit?.commitId || "0",
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
const getCommitById = (commitId: string): Commit | null => {
  return mockCommits.find(c => c.commitId === commitId) || null;
};

// Function to combine asset, commit, and user data for frontend
const getAssetWithDetails = (asset: Asset): AssetWithDetails => {
  const latestCommit = getCommitById(asset.latestCommitId);
  const creatorCommit = mockCommits.filter(c => 
    c.notes.includes(`asset ${asset.assetName}`)
  ).pop(); // Get the oldest commit for this asset
  
  // Store the user's pennId (not full name) as checkedOutBy when checked out
  let checkedOutByPennId = null;
  if (asset.checkedOut) {
    // Find the user who last modified the asset
    checkedOutByPennId = latestCommit?.pennKey || null;
  }
  
  return {
    name: asset.assetName,
    thumbnailUrl: asset.thumbnailUrl,
    version: latestCommit?.versionNum || "01.00.00",
    creator: getUserFullName(creatorCommit?.pennKey || null) || "Unknown",
    lastModifiedBy: getUserFullName(latestCommit?.pennKey || null) || "Unknown",
    checkedOutBy: checkedOutByPennId, // Store pennId instead of fullName
    isCheckedOut: asset.checkedOut,
    materials: latestCommit?.hasMaterials || false,
    keywords: asset.keywords,
    description: latestCommit?.notes || "No description available",
    createdAt: creatorCommit?.commitDate || new Date().toISOString(),
    updatedAt: latestCommit?.commitDate || new Date().toISOString(),
  };
};

// Function to simulate API loading delay
const simulateApiDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// API functions that would connect to Express backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Get all assets with optional filtering
  async getAssets(params?: { search?: string; author?: string; checkedInOnly?: boolean; sortBy?: string }) {
    try {
      console.log('[DEBUG] API: getAssets called with params:', params);
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.author) queryParams.append('author', params.author);
      if (params?.checkedInOnly) queryParams.append('checkedInOnly', 'true');
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // In development, use mock data (unchanged)
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] API: Using mock data for getAssets');
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
      }
      
      // In production, call API
      console.log(`[DEBUG] API: Fetching from ${API_URL}/assets${queryString}`);
      const response = await fetch(`${API_URL}/assets${queryString}`);
      
      if (!response.ok) {
        console.error(`[ERROR] API: Failed to fetch assets, status: ${response.status}`);
        throw new Error('Failed to fetch assets');
      }
      
      const data = await response.json();
      console.log(`[DEBUG] API: Received ${data.assets?.length || 0} assets from server`);
      return data;
    } catch (error) {
      console.error("[ERROR] API: Failed to fetch assets:", error);
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
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await simulateApiDelay();
        const asset = mockAssets.find(a => a.assetName === id);
        
        if (!asset) {
          throw new Error("Asset not found");
        }
        
        const assetWithDetails = getAssetWithDetails(asset);
        console.log("Asset details:", assetWithDetails);
        return { asset: assetWithDetails };
      }
      
      // In production, call API
      const response = await fetch(`${API_URL}/assets/${id}`);
      if (!response.ok) throw new Error('Failed to fetch asset details');
      
      const data = await response.json();
      return data;
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
  async checkoutAsset(id: string, pennId: string) {
    try {
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await simulateApiDelay();
        const assetIndex = mockAssets.findIndex(a => a.assetName === id);
        
        if (assetIndex === -1) {
          throw new Error("Asset not found");
        }
        
        if (mockAssets[assetIndex].checkedOut) {
          const checkedOutBy = mockAssets[assetIndex].latestCommitId.toString();
          const checkedOutByName = getUserFullName(checkedOutBy);
          throw new Error(`Asset is already checked out by ${checkedOutByName}`);
        }
        
        // Find user by pennId
        const user = mockUsers.find(u => u.pennId === pennId);
        if (!user) {
          throw new Error("User not found");
        }
        
        // Create a new commit for this checkout
        const newCommitId = (mockCommits.length + 1).toString();
        const lastCommit = getCommitById(mockAssets[assetIndex].latestCommitId);
        
        const newCommit: Commit = {
          commitId: newCommitId,
          pennKey: user.pennId,
          versionNum: lastCommit?.versionNum || "01.00.00",
          notes: `Checked out ${mockAssets[assetIndex].assetName}`,
          prevCommitId: lastCommit?.commitId || null,
          commitDate: new Date().toISOString(),
          hasMaterials: lastCommit?.hasMaterials || false,
          state: []
        };
        
        // Add the new commit to mock data
        mockCommits.unshift(newCommit);
        
        // Update the asset (in a real app, this would update MongoDB)
        mockAssets[assetIndex] = {
          ...mockAssets[assetIndex],
          checkedOut: true,
          latestCommitId: newCommitId
        };
        
        const updatedAsset = getAssetWithDetails(mockAssets[assetIndex]);
        console.log("Updated asset after checkout:", updatedAsset);
        return { asset: updatedAsset };
      }
      
      // In production, call API
      const response = await fetch(`${API_URL}/assets/${id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pennId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check out asset');
      }
      
      const data = await response.json();
      return data;
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
  async checkinAsset(id: string, pennId: string) {
    try {
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await simulateApiDelay();
        const assetIndex = mockAssets.findIndex(a => a.assetName === id);
        
        if (assetIndex === -1) {
          throw new Error("Asset not found");
        }
        
        if (!mockAssets[assetIndex].checkedOut) {
          throw new Error("Asset is not checked out");
        }
        
        // Get the asset details to check who checked it out
        const assetDetails = getAssetWithDetails(mockAssets[assetIndex]);
        
        // Verify the user who's checking in is the one who checked out
        if (assetDetails.checkedOutBy !== pennId) {
          const checkedOutByName = getUserFullName(assetDetails.checkedOutBy);
          throw new Error(`Asset is checked out by ${checkedOutByName}, not you`);
        }
        
        // Create a new commit for this check-in
        const lastCommit = getCommitById(mockAssets[assetIndex].latestCommitId);
        if (!lastCommit) {
          throw new Error("Could not find the last commit");
        }
        
        // Update version (simplified for mock)
        const versionParts = lastCommit.versionNum.split('.');
        const minorVersion = parseInt(versionParts[1]) + 1;
        const newVersion = `${versionParts[0]}.${minorVersion.toString().padStart(2, '0')}.00`;
        
        // Create a new commit
        const newCommitId = (mockCommits.length + 1).toString();
        const newCommit: Commit = {
          commitId: newCommitId,
          pennKey: pennId,
          versionNum: newVersion,
          notes: `Update to ${mockAssets[assetIndex].assetName}`,
          prevCommitId: lastCommit.commitId,
          commitDate: new Date().toISOString(),
          hasMaterials: lastCommit.hasMaterials,
          state: []
        };
        
        // Add the new commit to mock data
        mockCommits.unshift(newCommit);
        
        // Update the asset with the new commit ID
        mockAssets[assetIndex] = {
          ...mockAssets[assetIndex],
          latestCommitId: newCommitId,
          checkedOut: false,
          lastApprovedId: "0"
        };
        
        const updatedAsset = getAssetWithDetails(mockAssets[assetIndex]);
        console.log("Updated asset after check-in:", updatedAsset);
        return { asset: updatedAsset };
      }
      
      // In production, call API
      const response = await fetch(`${API_URL}/assets/${id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pennId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in asset');
      }
      
      const data = await response.json();
      return data;
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
  
  // Download a copy of the asset
  async downloadAsset(id: string) {
    try {
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await simulateApiDelay();
        const asset = mockAssets.find(a => a.assetName === id);
        
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
      }
      
      // In production, call API
      const response = await fetch(`${API_URL}/assets/${id}/download`);
      if (!response.ok) throw new Error('Failed to download asset');
      
      // Handle file download response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-${id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: "Download Complete",
        description: "Asset has been downloaded.",
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
      // This would typically be handled by a desktop app integration
      // For now, we'll just show a toast notification
      
      toast({
        title: "Launching Application",
        description: `Opening asset ${id} in the content creation app.`,
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
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await simulateApiDelay();
        
        // Extract unique authors from our mock data
        return { authors: mockUsers.map(user => user.fullName) };
      }
      
      // In production, call API
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch authors');
      
      const data = await response.json();
      return { authors: data.users.map((user: User) => user.fullName) };
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