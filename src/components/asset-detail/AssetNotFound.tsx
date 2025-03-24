
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AssetNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Asset Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested asset could not be found.</p>
        <Button onClick={() => navigate("/assets")}>Return to Asset Browser</Button>
      </div>
    </div>
  );
};

export default AssetNotFound;
