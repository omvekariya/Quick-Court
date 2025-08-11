export type Venue = {
  id: string;
  name: string;
  sportTypes: string[];
  pricePerHour: number;
  location: string;
  rating: number;
  images: string[];
  description: string;
  amenities: string[];
  courts: { id: string; name: string; sportType: string; pricePerHour: number }[];
};

export type Booking = {
  id: string;
  venueId: string;
  venueName: string;
  sportType: string;
  courtName: string;
  date: string;
  time: string;
  status: "Confirmed" | "Cancelled" | "Completed";
  total: number;
};

export const venues: Venue[] = [
  {
    id: "v1",
    name: "Greenfield Sports Arena",
    sportTypes: ["Badminton", "Tennis", "Futsal"],
    pricePerHour: 18,
    location: "Downtown",
    rating: 4.7,
    images: ["/placeholder.svg"],
    description:
      "Modern multi-sport venue with fresh courts and clean facilities. Perfect for friends and leagues.",
    amenities: ["Parking", "Locker Rooms", "Drinking Water"],
    courts: [
      { id: "c1", name: "Court 1", sportType: "Badminton", pricePerHour: 18 },
      { id: "c2", name: "Court 2", sportType: "Badminton", pricePerHour: 18 },
      { id: "c3", name: "Tennis A", sportType: "Tennis", pricePerHour: 25 },
    ],
  },
  {
    id: "v2",
    name: "Riverside Turf Complex",
    sportTypes: ["Football", "Cricket"],
    pricePerHour: 30,
    location: "Riverside",
    rating: 4.5,
    images: ["/placeholder.svg"],
    description:
      "Premium 5-a-side and 7-a-side turf grounds with bright lighting and changing rooms.",
    amenities: ["Flood Lights", "Cafe", "Showers"],
    courts: [
      { id: "c4", name: "Turf 5s", sportType: "Football", pricePerHour: 30 },
      { id: "c5", name: "Turf 7s", sportType: "Football", pricePerHour: 40 },
    ],
  },
  {
    id: "v3",
    name: "City Table Tennis Hub",
    sportTypes: ["Table Tennis"],
    pricePerHour: 12,
    location: "Midtown",
    rating: 4.6,
    images: ["/placeholder.svg"],
    description: "Dedicated TT center with professional tables and coaching options.",
    amenities: ["Coaching", "AC Hall", "Pro Shop"],
    courts: [
      { id: "c6", name: "Table 1", sportType: "Table Tennis", pricePerHour: 12 },
      { id: "c7", name: "Table 2", sportType: "Table Tennis", pricePerHour: 12 },
    ],
  },
];

export const bookings: Booking[] = [
  {
    id: "b1",
    venueId: "v1",
    venueName: "Greenfield Sports Arena",
    sportType: "Badminton",
    courtName: "Court 1",
    date: "2025-08-12",
    time: "07:00 - 08:00",
    status: "Confirmed",
    total: 18,
  },
  {
    id: "b2",
    venueId: "v2",
    venueName: "Riverside Turf Complex",
    sportType: "Football",
    courtName: "Turf 5s",
    date: "2025-08-13",
    time: "18:00 - 19:00",
    status: "Completed",
    total: 30,
  },
];
