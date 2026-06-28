import React, { useState, useEffect } from "react";
import { DayItinerary, Activity } from "../types";
import { Clock, Navigation, MapPin, Tag, Calendar, ExternalLink } from "lucide-react";

interface ItineraryTimelineProps {
  itineraryDays: DayItinerary[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSelectActivity?: (activity: Activity) => void;
  activeActivityName?: string;
  onViewOnMap?: (activity: Activity) => void;
}

// Smart component to dynamically fetch images from Unsplash based on place names
function DynamicDestinationImage({ placeName }: { placeName: string }) {
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600"); // Travel fallback placeholder

  useEffect(() => {
    async function fetchImage() {
      try {
        const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
        if (!accessKey) return;

        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(placeName)}&per_page=1`,
          {
            headers: {
              Authorization: `Client-ID ${accessKey}`
            }
          }
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setImageUrl(data.results[0].urls.regular);
        }
      } catch (error) {
        console.error("Error fetching image from Unsplash:", error);
      }
    }

    if (placeName) {
      fetchImage();
    }
  }, [placeName]);

  return (
    <img
      src={imageUrl}
      alt={placeName}
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={(e) => {
        e.currentTarget.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600";
      }}
    />
  );
}

export default function ItineraryTimeline({
  itineraryDays,
  selectedDay,
  onSelectDay,
  onSelectActivity,
  activeActivityName,
  onViewOnMap,
}: ItineraryTimelineProps) {
  const activeDayData = itineraryDays.find((d) => d.dayNumber === selectedDay);

  return (
    <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-sm" id="timeline-container">
      {/* Day Picker Tab Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <h3 className="text-base font-serif italic text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#d4af37]" />
          Daily Schedule
        </h3>
        <div className="flex gap-1.5" id="day-selector-tabs">
          {itineraryDays.map((day) => (
            <button
              id={`day-tab-${day.dayNumber}`}
              key={day.dayNumber}
              onClick={() => onSelectDay(day.dayNumber)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                selectedDay === day.dayNumber
                  ? "bg-gold text-black shadow-lg shadow-gold/15"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {activeDayData ? (
        <div className="space-y-6">
          {/* Day Header Info */}
          <div className="bg-white/[0.01] rounded-xl p-4 border border-white/10 flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] uppercase font-mono font-bold text-[#d4af37] block tracking-widest">
                Best Timing for Day {selectedDay}
              </span>
              <p className="text-sm font-semibold text-white/80 mt-0.5">
                {activeDayData.bestTimeForArrival}
              </p>
            </div>
          </div>

          {/* Activities Timeline Stack */}
          <div className="relative pl-6 border-l-2 border-white/10 ml-3 space-y-6">
            {activeDayData.activities.map((activity, idx) => {
              const isActive = activeActivityName === activity.placeName;

              return (
                <div
                  id={`activity-item-${idx}`}
                  key={idx}
                  onClick={() => onSelectActivity && onSelectActivity(activity)}
                  className="relative group cursor-pointer"
                >
                  {/* Timeline bullet pin */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                      isActive
                        ? "bg-[#d4af37] border-[#d4af37] scale-125 shadow-sm"
                        : "bg-[#080808] border-white/20 group-hover:border-[#d4af37] group-hover:scale-110"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-black" : "bg-white/10 group-hover:bg-[#d4af37]"}`} />
                  </div>

                  {/* Activity Content Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? "border-gold bg-gold/10 ring-1 ring-gold shadow-sm"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-28 h-24 sm:h-28 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <DynamicDestinationImage placeName={activity.placeName} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-mono text-[#d4af37] tracking-widest font-bold block">
                              Stop {idx + 1}
                            </span>
                            <h4 className="text-sm md:text-base font-bold text-white leading-tight font-serif">
                              {activity.placeName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10 shrink-0">
                            <Tag className="w-3 h-3 text-white/40 shrink-0" />
                            <span>{activity.ticketPricing}</span>
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-white/70 leading-relaxed font-medium">
                          {activity.placeDetails}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5 text-[10px] text-white/30 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-white/30" />
                          <span>Coordinate:</span>
                        </div>
                        <span className="text-white/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          {activity.geoCoordinates.lat.toFixed(5)}°, {activity.geoCoordinates.lng.toFixed(5)}°
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onViewOnMap && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewOnMap(activity);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 hover:border-[#d4af37]/50 text-[#d4af37] font-bold rounded-md text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                            <span>View on Map</span>
                          </button>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.placeName)}+${activity.geoCoordinates.lat},${activity.geoCoordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-md text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                          title="Open in Google Maps"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/30 text-xs">
          Select a day to view daily scheduled attractions.
        </div>
      )}
    </div>
  );
}