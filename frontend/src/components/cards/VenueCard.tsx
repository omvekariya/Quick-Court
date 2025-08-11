import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  rating: number;
  totalRatings: number;
  images: string[] | string;
  amenities: string[] | string;
  ownerId: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  venue: Venue;
}

export default function VenueCard({ venue }: Props) {
  const rawImages = venue.images ?? [];
  const images = Array.isArray(rawImages)
    ? rawImages
    : typeof rawImages === 'string'
      ? (() => { try { return JSON.parse(rawImages); } catch { return []; } })()
      : [];

  const rawAmenities = venue.amenities ?? [];
  const amenities = Array.isArray(rawAmenities)
    ? rawAmenities
    : typeof rawAmenities === 'string'
      ? (() => { try { return JSON.parse(rawAmenities); } catch { return []; } })()
      : [];

  const rating = typeof venue.rating === 'number' ? venue.rating : 0;
  const totalRatings = typeof venue.totalRatings === 'number' ? venue.totalRatings : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="aspect-[16/9] w-full overflow-hidden rounded-md">
          <img
            src={(images[0] as string) || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'}
            alt={`${venue.name ?? 'Venue'} sports facility image`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <CardTitle className="mt-3 text-lg">{venue.name ?? 'Unnamed Venue'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {venue.description ?? ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {amenities.slice(0, 3).map((amenity: string) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{amenities.length - 3} more
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>{venue.location ?? ''}</span>
          <span className="flex items-center gap-1">
            ⭐ {rating.toFixed(1)}
            <span className="text-xs">({totalRatings})</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{venue.address ?? ''}</span>
          <Button asChild size="sm">
            <Link to={`/venue/${venue.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
