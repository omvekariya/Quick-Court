import { useLocation } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  sport: string;
  setSport: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  minPrice: number;
  setMinPrice: (v: number) => void;
  availableSports: string[];
  loading?: boolean;
}

export default function VenueFilters({
  search,
  setSearch,
  sport,
  setSport,
  maxPrice,
  setMaxPrice,
  minPrice,
  setMinPrice,
  availableSports,
  loading = false,
}: Props) {
  const location = useLocation();
  const sports = useMemo(() => [...availableSports], [availableSports]);

  // Prefill values from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get("q");
    const sportParam = params.get("sport");

    if (qParam && qParam !== search) {
      setSearch(qParam);
    }
    if (sportParam && sportParam !== sport) {
      setSport(sportParam);
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Search</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Label>Sport</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Label>Price Range</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Label>Price Range</Label>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues or locations"
        />
      </div>
      <div className="space-y-2">
        <Label>Sport</Label>
        <Select value={sport} onValueChange={(v) => setSport(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="minPrice">Min price (${minPrice}/hr)</Label>
        <input
          id="minPrice"
          type="range"
          min={0}
          max={60}
          step={5}
          value={minPrice}
          onChange={(e) => setMinPrice(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxPrice">Max price (${maxPrice}/hr)</Label>
        <input
          id="maxPrice"
          type="range"
          min={5}
          max={60}
          step={1}
          value={maxPrice}
          onChange={(e) => setMaxPrice(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}
