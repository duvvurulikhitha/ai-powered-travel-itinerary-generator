import React, { useState, useEffect } from "react";
import { Hotel } from "../types";
import { Star, MapPin, Building, ChevronRight, DollarSign } from "lucide-react";

interface HotelSectionProps {
  hotels: Hotel[];
  onSelectHotel?: (hotel: Hotel) => void;
  activeHotelName?: string;
}

// Micro-component to look up hotel-specific imagery dynamically from Unsplash
function DynamicHotelImage({ hotelName, className }: { hotelName: string; className?: string }) {
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600"); // Quality fallback

  useEffect(() => {
    async function fetchHotelImage() {
      try {
        const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
        if (!accessKey) return;

        const searchQuery = `${hotelName} hotel accommodation`;
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1`,
          {
            headers: {
              Authorization: `Client-ID ${accessKey}`
            }
          }
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setImageUrl(data.results[0].urls.small);
        }
      } catch (error) {
        console.error("Error fetching hotel image from Unsplash:", error);
      }
    }

    if (hotelName) {
      fetchHotelImage();
    }
  }, [hotelName]);

  return (
    <img
      src={imageUrl}
      alt={hotelName}
      referrerPolicy="no-referrer"
      className={className || "w-full h-full object-cover"}
      onError={(e) => {
        e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600";
      }}
    />
  );
}

export default function HotelSection({
  hotels,
  onSelectHotel,
  activeHotelName,
}: HotelSectionProps) {
  return (
    <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-sm" id="hotels-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-serif italic text-white flex items-center gap-2">
          <Building className="w-5 h-5 text-[#d4af37]" />
          Recommended Stays
        </h3>
        <span className="text-xs text-white/40 font-medium font-mono">
          {hotels.length} Stay{hotels.length > 1 ? "s" : ""} Curated
        </span>
      </div>

      <div className="space-y-4">
        {hotels.map((hotel, idx) => {
          const isActive = activeHotelName === hotel.hotelName;

          return (
            <div
              id={`hotel-card-${idx}`}
              key={idx}
              onClick={() => onSelectHotel && onSelectHotel(hotel)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-stretch md:items-start ${
                isActive
                  ? "border-gold bg-gold/10 ring-1 ring-gold shadow-sm"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
              }`}
            >
              {/* Dynamic Unsplash Image wrapper using your original container sizes */}
              <div className="w-full md:w-32 h-28 md:h-24 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <DynamicHotelImage
                  hotelName={hotel.hotelName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-sm md:text-base leading-tight font-serif">
                    {hotel.hotelName}
                  </h4>
                  <div className="flex items-center gap-0.5 bg-gold/10 text-[#d4af37] px-2 py-0.5 rounded text-xs font-bold border border-gold/20">
                    <Star className="w-3 h-3 fill-gold stroke-gold" />
                    <span>{hotel.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-xs text-white/40 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="line-clamp-1">{hotel.address}</span>
                </p>

                <p className="text-xs text-white/60 leading-relaxed pt-1 font-medium">
                  {hotel.description}
                </p>
              </div>

              <div className="flex md:flex-col items-end justify-between w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 gap-2">
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-semibold">
                    EST. RATE
                  </span>
                  <span className="text-sm md:text-base font-bold text-[#d4af37] font-mono">
                    {hotel.priceRange}
                  </span>
                </div>

                <button
                  id={`locate-hotel-${idx}`}
                  type="button"
                  className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-all ${
                    isActive
                      ? "bg-gold text-black"
                      : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
                  }`}
                >
                  <span>Locate</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}