
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
  prevCommitId: number | null;
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

// API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to handle API errors
const handleApiError = (error: any, message: string) => {
  console.error(message, error);
  
  let errorMessage = "An unexpected error occurred";
  
  if (error.response && error.response.data && error.response.data.error) {
    errorMessage = error.response.data.error;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive"
  });
  
  return Promise.reject(error);
};

// API functions that connect to Express, MongoDB and S3
export const api = {
  // Get all assets with optional filtering
  async getAssets(params?: { search?: string; author?: string; checkedInOnly?: boolean; sortBy?: string }) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.author) queryParams.append("author", params.author);
      if (params?.checkedInOnly) queryParams.append("checkedInOnly", "true");
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/assets${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch assets");
      }
      
      const data = await response.json();
      return data; // { assets: AssetWithDetails[] }
    } catch (error) {
      return handleApiError(error, "Failed to fetch assets:");
    }
  },
  
  // Get a single asset by ID
  async getAsset(id: string) {
    try {
      const response = await fetch(`${API_URL}/assets/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Asset not found");
      }
      
      const data = await response.json();
      return data; // { asset: AssetWithDetails }
    } catch (error) {
      return handleApiError(error, `Failed to fetch asset ${id}:`);
    }
  },
  
  // Check out an asset
  async checkoutAsset(id: string, userName: string) {
    try {
      const response = await fetch(`${API_URL}/assets/${id}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userName })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check out asset");
      }
      
      const data = await response.json();
      return data; // { asset: AssetWithDetails }
    } catch (error) {
      return handleApiError(error, `Failed to check out asset ${id}:`);
    }
  },
  
  // Check in an asset
  async checkinAsset(id: string, userName: string) {
    try {
      const response = await fetch(`${API_URL}/assets/${id}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userName })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check in asset");
      }
      
      const data = await response.json();
      return data; // { asset: AssetWithDetails }
    } catch (error) {
      return handleApiError(error, `Failed to check in asset ${id}:`);
    }
  },
  
  // Download a copy of the asset
  async downloadAsset(id: string) {
    try {
      const response = await fetch(`${API_URL}/assets/${id}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download asset");
      }
      
      const data = await response.json();
      
      // If we have a download URL, open it in a new tab
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
      
      toast({
        title: "Download Started",
        description: "Your download should begin shortly.",
      });
      
      return data; // { downloadUrl: string, success: boolean }
    } catch (error) {
      return handleApiError(error, `Failed to download asset ${id}:`);
    }
  },
  
  // Launch DCC (Digital Content Creation) app with the asset
  async launchDCC(id: string) {
    try {
      const response = await fetch(`${API_URL}/assets/${id}/launch-dcc`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to launch application");
      }
      
      const data = await response.json();
      
      toast({
        title: "Launching Application",
        description: data.message || "Opening the content creation app.",
      });
      
      return data; // { success: boolean, message: string }
    } catch (error) {
      return handleApiError(error, `Failed to launch DCC for asset ${id}:`);
    }
  },
  
  // Get all unique authors from assets
  async getAuthors() {
    try {
      const response = await fetch(`${API_URL}/users/authors`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load author list");
      }
      
      const data = await response.json();
      return data; // { authors: string[] }
    } catch (error) {
      return handleApiError(error, "Failed to fetch authors:");
    }
  }
};
