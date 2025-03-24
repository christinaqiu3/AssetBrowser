
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AssetDetailHeaderProps {
  title: string;
}

const AssetDetailHeader = ({ title }: AssetDetailHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6">
      <Button 
        variant="ghost" 
        className="flex items-center gap-1 mb-4 hover:bg-secondary/80 transition-all"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Assets
      </Button>
      
      <h1 className="text-3xl font-bold animate-fade-in">{title}</h1>
    </div>
  );
};

export default AssetDetailHeader;
