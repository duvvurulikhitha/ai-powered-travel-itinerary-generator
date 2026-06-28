import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { TripItinerary, Hotel, Activity, GeoCoordinates } from "../types";
import { Map as MapIcon, X, ZoomIn, ZoomOut, Compass, Landmark, Hotel as HotelIcon, ExternalLink } from "lucide-react";

interface LeafletMapViewProps {
  itinerary: TripItinerary;
  selectedDay: number;
  activeItem?: { type: "hotel" | "activity"; name: string } | null;
  onSelectActivity?: (activity: Activity) => void;
  onSelectHotel?: (hotel: Hotel) => void;
  onClose?: () => void;
}

export default function LeafletMapView({
  itinerary,
  selectedDay,
  activeItem,
  onSelectActivity,
  onSelectHotel,
  onClose,
}: LeafletMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  
  const [selectedPin, setSelectedPin] = useState<{
    name: string;
    type: "hotel" | "activity";
    details: string;
    coordinates: GeoCoordinates;
    pricing: string;
    dayNumber?: number;
  } | null>(null);

  // Compile all pins from the itinerary
  const pins: Array<{
    id: string;
    name: string;
    type: "hotel" | "activity";
    coordinates: GeoCoordinates;
    details: string;
    pricing: string;
    dayNumber?: number;
  }> = [];

  // Add hotels
  itinerary.hotels.forEach((hotel, idx) => {
    pins.push({
      id: `hotel-${idx}`,
      name: hotel.hotelName,
      type: "hotel",
      coordinates: hotel.geoCoordinates,
      details: hotel.description,
      pricing: hotel.priceRange,
    });
  });

  // Add all activities across all days
  itinerary.itinerary.forEach((day) => {
    day.activities.forEach((activity, idx) => {
      pins.push({
        id: `activity-${day.dayNumber}-${idx}`,
        name: activity.placeName,
        type: "activity",
        coordinates: activity.geoCoordinates,
        details: activity.placeDetails,
        pricing: activity.ticketPricing,
        dayNumber: day.dayNumber,
      });
    });
  });

  // Handle Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Find center point for initial map view
    let centerLat = 20;
    let centerLng = 0;
    if (pins.length > 0) {
      const sumLat = pins.reduce((sum, p) => sum + p.coordinates.lat, 0);
      const sumLng = pins.reduce((sum, p) => sum + p.coordinates.lng, 0);
      centerLat = sumLat / pins.length;
      centerLng = sumLng / pins.length;
    }

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Use CartoDB Dark Matter tile layer for an incredibly premium dark theme that matches the website perfectly!
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Trigger standard flyTo to show the destination city with a majestic animation
    setTimeout(() => {
      if (pins.length > 0) {
        // Fit bounds smoothly
        const bounds = L.latLngBounds(pins.map(p => [p.coordinates.lat, p.coordinates.lng]));
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 1.8,
          easeLinearity: 0.25
        });
      }
    }, 300);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Markers and Paths when Day, Itinerary, or ActiveItem changes
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear old markers
    markersLayer.clearLayers();

    // Clear old path lines
    if (pathLineRef.current) {
      pathLineRef.current.remove();
      pathLineRef.current = null;
    }

    // Filter pins for active day schedule
    const activeDayPins = pins.filter(p => p.type === "hotel" || p.dayNumber === selectedDay);

    // Render Markers using Tailwind-styled Leaflet DivIcons!
    activeDayPins.forEach((pin) => {
      const isHotel = pin.type === "hotel";
      const isActive = activeItem?.name === pin.name && activeItem?.type === pin.type;

      // Beautiful CSS indicator with gold gradients
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          ${isActive ? `
            <div class="absolute -inset-3 rounded-full bg-amber-500/25 animate-ping duration-[2000ms]"></div>
            <div class="absolute -inset-1.5 rounded-full bg-amber-500/20"></div>
          ` : ""}
          <div class="w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
            isActive
              ? "bg-[#d4af37] border-white text-black scale-110 font-bold shadow-lg shadow-amber-500/30"
              : isHotel
                ? "bg-[#0f0f0f] border-[#d4af37]/40 text-[#d4af37] hover:border-[#d4af37] hover:text-white"
                : "bg-[#161616] border-white/20 text-white hover:border-[#d4af37] hover:text-[#d4af37]"
          }">
            ${isHotel 
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5"><path d="M2 22v-3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3"/><path d="M19 16V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v11"/><path d="M9 7h1"/><path d="M9 11h1"/><path d="M14 7h1"/><path d="M14 11h1"/></svg>`
              : `<span class="text-[10px] font-mono font-bold">${pin.dayNumber ? `D${pin.dayNumber}` : ""}</span>`
            }
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-leaflet-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([pin.coordinates.lat, pin.coordinates.lng], {
        icon: customIcon,
      });

      // Bind simple tooltip popup
      marker.on("click", () => {
        setSelectedPin(pin);
        map.flyTo([pin.coordinates.lat, pin.coordinates.lng], 15, {
          duration: 1.2,
        });
      });

      marker.addTo(markersLayer);

      // If this item was programmatically highlighted, let's open it and flyTo it smoothly
      if (isActive) {
        setSelectedPin(pin);
        map.flyTo([pin.coordinates.lat, pin.coordinates.lng], 15, {
          duration: 1.2,
        });
      }
    });

    // Draw paths for the current day's activities
    const currentDayActivities = activeDayPins
      .filter(p => p.type === "activity" && p.dayNumber === selectedDay)
      .sort((a, b) => (a.id > b.id ? 1 : -1)); // sequential order

    if (currentDayActivities.length > 1) {
      const latLngs = currentDayActivities.map(act => [act.coordinates.lat, act.coordinates.lng] as L.LatLngTuple);
      const polyline = L.polyline(latLngs, {
        color: "#d4af37",
        weight: 3,
        opacity: 0.8,
        dashArray: "6, 6",
      }).addTo(map);

      pathLineRef.current = polyline;
    }
  }, [selectedDay, activeItem, itinerary]);

  // Handle Zoom In/Out manually
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetBounds = () => {
    if (mapRef.current && pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(p => [p.coordinates.lat, p.coordinates.lng]));
      mapRef.current.flyToBounds(bounds, {
        padding: [60, 60],
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#050505] flex flex-col overflow-hidden" id="leaflet-map-view">
      {/* Absolute Overlay Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-[1000]">
        <div className="bg-[#0c0c0c]/90 border border-white/10 rounded-xl px-4 py-3 shadow-xl backdrop-blur-md flex items-center gap-3 pointer-events-auto">
          <div className="p-1.5 bg-gold/10 border border-gold/25 rounded-lg text-gold shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-serif italic text-white tracking-wide">
              Bespoke Destination Canvas
            </h3>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
              {itinerary.overallLocation?.city || "Attractions Pinned"} • Day {selectedDay}
            </p>
          </div>
        </div>

        {/* Map Control Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#0c0c0c]/90 border border-white/10 rounded-xl p-1 shadow-xl backdrop-blur-md flex items-center gap-1">
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetBounds}
              className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Reset Zoom Bounds"
            >
              <Compass className="w-4 h-4 text-gold animate-pulse" />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 bg-[#0c0c0c]/90 border border-white/10 hover:border-red-500/40 text-white/80 hover:text-red-400 rounded-xl shadow-xl backdrop-blur-md transition-all cursor-pointer"
              title="Return to Itinerary View"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Actual Map Target Canvas */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-10" />

      {/* Selected Marker Detail Card Overlay Drawer */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:max-w-md bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-md z-[1000] flex flex-col gap-3.5 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-gold/10 text-gold border border-gold/20">
                {selectedPin.type === "hotel" ? "Premium Stay" : `Day ${selectedPin.dayNumber} Stop`}
              </span>
              <span className="text-[10px] font-mono text-white/40">{selectedPin.pricing}</span>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="p-1 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-serif italic text-white leading-tight">{selectedPin.name}</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium line-clamp-3">{selectedPin.details}</p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-1">
            <div className="text-[9px] text-white/30 font-mono">
              GPS: {selectedPin.coordinates.lat.toFixed(5)}°, {selectedPin.coordinates.lng.toFixed(5)}°
            </div>
            
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPin.name)}+${selectedPin.coordinates.lat},${selectedPin.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#d4af37] border border-white/10 hover:border-[#d4af37] text-white hover:text-black rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <span>Explore in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
