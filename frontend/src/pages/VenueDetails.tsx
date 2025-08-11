import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { venuesAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    enabled: !!id,
    queryKey: ["venue", id],
    queryFn: () => venuesAPI.getById(id as string),
    onError: (err) => {
      console.error('Venue details error:', err);
    },
    onSuccess: (data) => {
      console.log('Venue details loaded:', data);
    }
  });

  const payload = data?.data?.data as { venue: any; courts: any[]; reviews: any[] } | undefined;
  const venue = payload?.venue;
  const courts = payload?.courts ?? [];
  const reviews = payload?.reviews ?? [];

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load venue. Please try again later.</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>{venue?.name ? `${venue.name} – QuickCourt` : 'Venue – QuickCourt'}</title>
        {venue && (
          <>
            <meta name="description" content={`Book ${venue.name} in ${venue.location}.`} />
            <link rel="canonical" href={`/venue/${venue.id}`} />
            <script type="application/ld+json">{JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsActivityLocation",
              name: venue.name,
              address: venue.location,
              aggregateRating: {"@type":"AggregateRating", ratingValue: venue.rating, reviewCount: venue.totalRatings }
            })}</script>
          </>
        )}
      </Helmet>

      {isLoading || !venue ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (<Skeleton key={i} className="w-full h-40" />))}
            </div>
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {venue.images?.length ? (
              <div className="grid grid-cols-3 gap-2">
                {venue.images.map((src: string, i: number) => (
                  <img key={i} src={src} alt={`${venue.name} image ${i + 1}`} className="rounded-md object-cover w-full h-40" loading="lazy" />
                ))}
              </div>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{venue.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>Address</span><span>{venue.address}</span>
                  <span>Location</span><span>{venue.location}</span>
                </div>
              </CardContent>
            </Card>
            {venue.amenities?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {venue.amenities.map((a: string) => (
                    <Badge key={a} variant="secondary">{a}</Badge>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Courts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courts.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.sportName} · ${c.pricePerHour}/hr</div>
                    </div>
                    {user?.role !== 'admin' && (
                      <Button size="sm" onClick={() => navigate(`/book/${venue.id}`)}>Book</Button>
                    )}
                  </div>
                ))}
                {courts.length === 0 && (
                  <div className="text-sm text-muted-foreground">No active courts available.</div>
                )}
              </CardContent>
            </Card>

            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="border rounded-md p-3">
                      <div className="text-sm flex items-center justify-between">
                        <span className="font-medium">{r.userName}</span>
                        <span>⭐ {r.rating}</span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{venue.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Location</span>
                  <span>{venue.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Rating</span>
                  <span>⭐ {(venue.rating ?? 0).toFixed(1)} ({venue.totalRatings ?? 0})</span>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Status</span>
                    <Badge variant={venue.isApproved ? "default" : "secondary"}>
                      {venue.isApproved ? "Approved" : "Pending Approval"}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Courts</span>
                  <span>{courts.length}</span>
                </div>
                {user?.role !== 'admin' && (
                  <Button variant="hero" onClick={() => navigate(`/book/${venue.id}`)} className="w-full">
                    Book Now
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
