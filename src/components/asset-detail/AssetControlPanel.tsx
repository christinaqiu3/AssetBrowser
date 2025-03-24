
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, LockOpen, Download, PlayCircle } from "lucide-react";
import { AssetWithDetails } from "@/services/api";

interface AssetControlPanelProps {
  asset: AssetWithDetails;
  canCheckout: boolean;
  canCheckin: boolean;
  onCheckout: () => void;
  onCheckin: () => void;
  onDownload: () => void;
  onLaunchDCC: () => void;
}

const AssetControlPanel = ({
  asset,
  canCheckout,
  canCheckin,
  onCheckout,
  onCheckin,
  onDownload,
  onLaunchDCC
}: AssetControlPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Asset Details</h2>
        {asset?.isCheckedOut && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Checked Out
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">Version</div>
        <div className="text-sm font-medium">{asset?.version}</div>
        <Select disabled>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={asset?.version} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={asset?.version ?? ''}>{asset?.version}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="flex items-center gap-2" 
          onClick={onCheckout}
          disabled={!canCheckout}
        >
          <LockOpen className="h-4 w-4" />
          Check Out
        </Button>
        
        <Button 
          className="flex items-center gap-2" 
          onClick={onCheckin}
          disabled={!canCheckin}
        >
          <Lock className="h-4 w-4" />
          Check In
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
          Download Copy
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={onLaunchDCC}
        >
          <PlayCircle className="h-4 w-4" />
          Launch DCC
        </Button>
      </div>
    </div>
  );
};

export default AssetControlPanel;
