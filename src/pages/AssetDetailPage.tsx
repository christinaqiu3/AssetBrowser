import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { api, AssetWithDetails } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { toast } from "@/components/ui/use-toast";

import AssetDetailHeader from "@/components/asset-detail/AssetDetailHeader";
import AssetPreview from "@/components/asset-detail/AssetPreview";
import AssetControlPanel from "@/components/asset-detail/AssetControlPanel";
import AssetMetadata from "@/components/asset-detail/AssetMetadata";
import AssetDetailSkeleton from "@/components/asset-detail/AssetDetailSkeleton";
import AssetNotFound from "@/components/asset-detail/AssetNotFound";

const AssetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [asset, setAsset] = useState<AssetWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchAsset = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { asset } = await api.getAsset(id);
      setAsset(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAsset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  const handleCheckout = async () => {
    if (!id || !user || !asset) return;
    
    try {
      const { asset: updatedAsset } = await api.checkoutAsset(id, user.name);
      setAsset(updatedAsset);
      toast({
        title: "Asset Checked Out",
        description: `You have successfully checked out ${asset.name}.`,
      });
    } catch (error) {
      // Error handling is done in the API service
    }
  };
  
  const handleCheckin = async () => {
    if (!id || !user || !asset) return;
    
    try {
      const { asset: updatedAsset } = await api.checkinAsset(id, user.name);
      setAsset(updatedAsset);
      toast({
        title: "Asset Checked In",
        description: `You have successfully checked in ${asset.name}.`,
      });
    } catch (error) {
      // Error handling is done in the API service
    }
  };
  
  const handleDownload = async () => {
    if (!id) return;
    
    try {
      await api.downloadAsset(id);
    } catch (error) {
      // Error handling is done in the API service
    }
  };
  
  const handleLaunchDCC = async () => {
    if (!id) return;
    
    try {
      await api.launchDCC(id);
    } catch (error) {
      // Error handling is done in the API service
    }
  };
  
  const canCheckout = asset && !asset.isCheckedOut && user;
  const canCheckin = asset && asset.isCheckedOut && asset.checkedOutBy === user?.name;
  
  if (isLoading) {
    return <AssetDetailSkeleton />;
  }
  
  if (!asset) {
    return <AssetNotFound />;
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <AssetDetailHeader title="Asset Details" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <AssetPreview asset={asset} />
        
        <div className="lg:col-span-5 space-y-6 animate-slide-in">
          <AssetControlPanel
            asset={asset}
            canCheckout={!!canCheckout}
            canCheckin={!!canCheckin}
            onCheckout={handleCheckout}
            onCheckin={handleCheckin}
            onDownload={handleDownload}
            onLaunchDCC={handleLaunchDCC}
          />
          
          <Separator />
          
          <AssetMetadata asset={asset} />
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
