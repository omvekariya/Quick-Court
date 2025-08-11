import heroImage from "@/assets/quickcourt-hero.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VenueCard from "@/components/cards/VenueCard";
import { venues } from "@/data/mock";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Index = () => {
  const popular = venues.slice(0, 3);
  const popularSports = ["Badminton", "Football", "Tennis", "Table Tennis"];

  return (
    <main>
      <Helmet>
        <title>QuickCourt – Book Local Sports Facilities</title>
        <meta name="description" content="Book badminton, turf, and tennis courts near you in seconds." />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "QuickCourt",
          url: "/",
          potentialAction: {"@type":"SearchAction", target:"/venues?q={search_term_string}", queryInput:"required name=search_term_string"}
        })}</script>
      </Helmet>

      <section className="relative">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Sports courts hero image" className="h-96 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-background/10" />
        </div>
        <div className="container mx-auto px-4 h-96 relative flex flex-col items-start justify-center gap-4">
          <h1 className="text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight">
            Find and book the best courts near you
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Quick, simple, and reliable bookings for badminton, turf, tennis and more.
          </p>
          <div className="flex gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/venues">Explore Venues</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular Venues</h2>
          <Button variant="ghost" asChild>
            <Link to="/venues">View all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popular.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-4">Popular Sports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {popularSports.map((s) => (
            <Card key={s} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{s}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Book nearby {s} venues.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
