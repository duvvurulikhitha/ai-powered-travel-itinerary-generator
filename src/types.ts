export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface BudgetBreakdown {
  category: string;
  cost: string;
  percentage: number;
}

export interface EstimatedBudget {
  totalEstimatedCost: string;
  currency: string;
  breakdown: BudgetBreakdown[];
}

export interface OverallLocation {
  city: string;
  country: string;
  bestSeason: string;
  weatherSummary: string;
}

export interface Hotel {
  hotelName: string;
  address: string;
  priceRange: string;
  rating: number;
  geoCoordinates: GeoCoordinates;
  description: string;
  imageUrl?: string;
}

export interface Activity {
  placeName: string;
  placeDetails: string;
  ticketPricing: string;
  geoCoordinates: GeoCoordinates;
  imageUrl?: string;
}

export interface DayItinerary {
  dayNumber: number;
  bestTimeForArrival: string;
  activities: Activity[];
}

export interface TripItinerary {
  tripSummary: string;
  destinationImageUrl?: string;
  overallLocation?: OverallLocation;
  estimatedBudget?: EstimatedBudget;
  hotels: Hotel[];
  itinerary: DayItinerary[];
}

export interface ItineraryRequest {
  destination: string;
  companionType: "Just Me" | "A Couple" | "Family" | "Friends";
  budget: "Cheap" | "Moderate" | "Luxury";
  duration: string; // e.g. "3 Days", "5 Days"
}
