import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Users } from "lucide-react";

interface Court {
  id: string;
  name: string;
  description?: string;
  pricePerHour: number;
  isActive: boolean;
  sportId: string;
  sportType: string;
  sportIcon?: string;
}

interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  address?: string;
  rating: number;
  totalRatings?: number;
  images: string[] | string;
  amenities: string[] | string;
  sportTypes: string[];
  courts: Court[];
  minPrice?: number;
  maxPrice?: number;
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
  
  // Calculate price range from courts
  const priceRange = venue.courts && venue.courts.length > 0 
    ? venue.minPrice === venue.maxPrice 
      ? `$${venue.minPrice}/hr`
      : `$${venue.minPrice}-${venue.maxPrice}/hr`
    : 'Price not available';

  // Get unique sport types from courts
  const availableSports = venue.courts 
    ? [...new Set(venue.courts.map(court => court.sportType))]
    : venue.sportTypes || [];

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
        
        {/* Sport Types */}
        <div className="flex flex-wrap gap-2">
          {availableSports.slice(0, 3).map((sport: string) => (
            <Badge key={sport} variant="secondary" className="text-xs">
              {sport}
            </Badge>
          ))}
          {availableSports.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{availableSports.length - 3} more
            </Badge>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 2).map((amenity: string) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {amenities.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{amenities.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Location and Rating */}
        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {venue.location ?? ''}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            {rating.toFixed(1)}
            {totalRatings > 0 && (
              <span className="text-xs">({totalRatings})</span>
            )}
          </span>
        </div>

        {/* Price and Courts Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{priceRange}</span>
          <span className="text-muted-foreground">
            {venue.courts?.length || 0} court{venue.courts?.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {venue.address || venue.location}
          </span>
          <Button asChild size="sm">
            <Link to={`/venue/${venue.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
