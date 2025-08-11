import heroImage from "@/assets/quickcourt-hero.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import VenueCard from "@/components/cards/VenueCard";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { venuesAPI, sportsAPI } from "@/services/api";
import {
  Loader2,
  MapPin,
  Star,
  Clock,
  Users,
  Search,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Venue } from "@/data/mock";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const { user, logout } = useAuth();
  // Fetch popular venues (approved and active)
  const {
    data: venuesData,
    isLoading: venuesLoading,
    error: venuesError,
  } = useQuery({
    queryKey: ["popular-venues"],
    queryFn: async () => {
      const response = await venuesAPI.getAll({
        page: 1,
        limit: 6,
        // Only get approved and active venues
        // Backend should handle filtering
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all sports
  const {
    data: sportsData,
    isLoading: sportsLoading,
    error: sportsError,
  } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const response = await sportsAPI.getAll();
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Platform statistics - static for now
  const statsData = {
    totalVenues: 15,
    totalSports: 8,
    totalCourts: 45,
    averageRating: 4.6,
  };

  // Get popular venues (first 3)
  const popularVenues = venuesData?.slice(0, 3) || [];

  // Get popular sports (first 4, or all if less than 4)
  const popularSports = sportsData?.slice(0, 4) || [];

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedSport) params.append("sport", selectedSport);
      navigate(`/venues?${params.toString()}`);
    }
  };

  // Loading skeleton for venues
  const VenueSkeleton = () => (
    <div className="border rounded-lg overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );

  // Loading skeleton for sports
  const SportSkeleton = () => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );

  return (
    <main>
      <Helmet>
        <title>QuickCourt – Book Local Sports Facilities</title>
        <meta
          name="description"
          content="Book badminton, turf, and tennis courts near you in seconds."
        />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "QuickCourt",
            url: "/",
            potentialAction: {
              "@type": "SearchAction",
              target: "/venues?q={search_term_string}",
              queryInput: "required name=search_term_string",
            },
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Sports courts hero image"
            className="h-96 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-background/10" />
        </div>
        <div className="container mx-auto px-4 h-96 relative flex flex-col items-start justify-center gap-4">
          <h1 className="text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight">
            Find and book the best courts near you
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Quick, simple, and reliable bookings for badminton, turf, tennis and
            more.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search for venues, sports, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="border-0 focus-visible:ring-0"
                />
              </div>
              <Button onClick={handleSearch} className="px-6">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/venues">Explore Venues</Link>
            </Button>
            {!user && (
              <Button variant="outline" asChild>
                <Link to="/auth/signup">Sign up</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose QuickCourt?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
            <p className="text-muted-foreground">
              Book courts in seconds with our streamlined process
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
            <p className="text-muted-foreground">
              Compare prices and find the best deals in your area
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Venues</h3>
            <p className="text-muted-foreground">
              All venues are verified and quality-checked
            </p>
          </div>
        </div>
      </section>

      {/* Popular Venues Section */}
      <section className="container mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular Venues</h2>
          <Button variant="ghost" asChild>
            <Link to="/venues">View all</Link>
          </Button>
        </div>

        {venuesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <VenueSkeleton key={i} />
            ))}
          </div>
        ) : venuesError ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Unable to load venues at the moment.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : popularVenues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No venues available at the moment.
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link to="/venues">Browse All Venues</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Popular Sports Section */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-4">Popular Sports</h2>

        {sportsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SportSkeleton key={i} />
            ))}
          </div>
        ) : sportsError ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Unable to load sports information.
            </p>
          </div>
        ) : popularSports.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {popularSports.map((sport) => (
              <Card
                key={sport.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{sport.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Book nearby {sport.name.toLowerCase()} venues.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No sports available at the moment.
            </p>
          </div>
        )}
      </section>

      {/* Stats Section - Static data */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            QuickCourt at a Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {statsData.totalVenues}+
              </div>
              <p className="text-muted-foreground">Venues Available</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {statsData.totalSports}+
              </div>
              <p className="text-muted-foreground">Sports Types</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {statsData.totalCourts}+
              </div>
              <p className="text-muted-foreground">Total Courts</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {statsData.averageRating}⭐
              </div>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of sports enthusiasts who trust QuickCourt for their
          court bookings. Find your perfect venue and start playing today!
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/venues">Find Courts</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth/signup">Get Started</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
