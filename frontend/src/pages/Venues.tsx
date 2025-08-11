import { Helmet } from "react-helmet-async";
import { useMemo, useState, useEffect } from "react";
import VenueCard from "@/components/cards/VenueCard";
import VenueFilters from "@/components/filters/VenueFilters";
import { venuesAPI, sportsAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Venues() {
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("All");
  const [maxPrice, setMaxPrice] = useState(50);
  const [minPrice, setMinPrice] = useState(0);

  // Fetch venues
  const {
    data: venuesData,
    isLoading: venuesLoading,
    error: venuesError,
  } = useQuery({
    queryKey: ["venues", { sport, minPrice, maxPrice }],
    queryFn: () => venuesAPI.getAll({ sport: sport === "All" ? undefined : sport, minPrice, maxPrice }),
  });

  // Fetch sports
  const {
    data: sportsData,
    isLoading: sportsLoading,
  } = useQuery({
    queryKey: ["sports"],
    queryFn: () => sportsAPI.getAll(),
  });

  const availableSports = useMemo(() => {
    const list = sportsData?.data?.data ?? [];
    return ["All", ...list.map((s: any) => s.name)];
  }, [sportsData]);

  const filtered = useMemo(() => {
    const venuesList: any[] = venuesData?.data?.data ?? [];
    return venuesList.filter((v: any) => {
      const name = (v.name || '').toLowerCase();
      const loc = (v.location || '').toLowerCase();
      const q = search.toLowerCase();
      return name.includes(q) || loc.includes(q);
    });
  }, [venuesData, search]);

  if (venuesError) {
    return (
      <main className="container mx-auto px-4 py-10 space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load venues. Please try again later.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>Venues – QuickCourt</title>
        <meta name="description" content="Browse and filter approved sports venues near you." />
        <link rel="canonical" href="/venues" />
      </Helmet>

      <h1 className="text-3xl font-bold">Venues</h1>
      <VenueFilters
        search={search}
        setSearch={setSearch}
        sport={sport}
        setSport={setSport}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        availableSports={availableSports}
        loading={sportsLoading}
      />

      {venuesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v: any) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      )}

      {!venuesLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          {(venuesData?.data?.data ?? []).length === 0 ? (
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">No Venues Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There are currently no approved venues in your area. Check back later or contact us to list your venue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">No Venues Found</h3>
              <p className="text-muted-foreground">No venues match your current search criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
