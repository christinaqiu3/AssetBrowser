
import { useState } from "react";
import { Link } from "react-router-dom";
import { AssetWithDetails } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetCardProps {
  asset: AssetWithDetails;
}

const AssetCard = ({ asset }: AssetCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link to={`/assets/${asset.id}`} className="block">
      <Card className={cn(
        "asset-card h-full overflow-hidden",
        asset.isCheckedOut && "checked-out",
        !imageLoaded && "animate-pulse bg-muted"
      )}>
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100 animate-blur-in" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          {asset.isCheckedOut && (
            <div className="absolute top-2 right-2 bg-secondary/80 backdrop-blur-sm text-foreground px-2 py-1 rounded-md text-xs flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              Checked Out
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-1">{asset.name}</h3>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">{asset.creator}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {new Date(asset.updatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          </div>
          {asset.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {asset.keywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-muted-foreground"
                >
                  {keyword}
                </span>
              ))}
              {asset.keywords.length > 3 && (
                <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">
                  +{asset.keywords.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default AssetCard;
