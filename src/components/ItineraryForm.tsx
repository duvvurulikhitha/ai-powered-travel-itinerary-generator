import React, { useState } from "react";
import { ItineraryRequest } from "../types";
import { Compass, Users, IndianRupee, Calendar, MapPin, Sparkles } from "lucide-react";

interface ItineraryFormProps {
  onSubmit: (data: ItineraryRequest) => void;
  isLoading: boolean;
}

const PRESET_DESTINATIONS = [
  { name: "Tokyo, Japan", icon: "🌸", desc: "Tradition meets future" },
  { name: "Paris, France", icon: "🗼", desc: "Romantic art & cafés" },
  { name: "New York, USA", icon: "🗽", desc: "The city that never sleeps" },
  { name: "London, UK", icon: "🏰", desc: "Historic charm & royalty" },
  { name: "Rome, Italy", icon: "🏛️", desc: "Ancient ruins & culinary delights" },
];

export default function ItineraryForm({ onSubmit, isLoading }: ItineraryFormProps) {
  const [destination, setDestination] = useState("");
  const [companionType, setCompanionType] = useState<ItineraryRequest["companionType"]>("Just Me");
  const [budget, setBudget] = useState<ItineraryRequest["budget"]>("Moderate");
  const [duration, setDuration] = useState("3 Days");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    onSubmit({
      destination: destination.trim(),
      companionType,
      budget,
      duration,
    });
  };

  return (
    <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-sm" id="itinerary-form-container">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination Input */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2.5 flex items-center gap-1.5" htmlFor="destination-input">
            <MapPin className="w-4 h-4 text-[#d4af37]" />
            Where do you want to go?
          </label>
          <div className="relative">
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Paris, Tokyo, Reykjavik, Kyoto..."
              className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/10 focus:border-[#d4af37] font-medium transition-all"
              required
              disabled={isLoading}
            />
            <Compass className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
          </div>

          {/* Preset Buttons */}
          <div className="mt-4">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-medium block mb-2">Featured Destinations</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_DESTINATIONS.map((preset) => (
                <button
                  id={`preset-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  key={preset.name}
                  type="button"
                  onClick={() => setDestination(preset.name)}
                  className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-tight flex items-center gap-1.5 transition-all cursor-pointer ${
                    destination === preset.name
                      ? "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/35 shadow-sm"
                      : "bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/[0.05] hover:text-white"
                  }`}
                  disabled={isLoading}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Companion Selector */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#d4af37]" />
            Who is traveling with you?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(["Just Me", "A Couple", "Family", "Friends"] as const).map((type) => {
              const detailsMap: Record<string, string> = {
                "Just Me": "Solo explore",
                "A Couple": "Romantic escape",
                Family: "Kid-friendly pace",
                Friends: "Social adventure",
              };
              return (
                <button
                  id={`companion-btn-${type.toLowerCase().replace(" ", "-")}`}
                  key={type}
                  type="button"
                  onClick={() => setCompanionType(type)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    companionType === type
                      ? "border-[#d4af37] bg-[#d4af37]/10 ring-1 ring-[#d4af37]"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                  disabled={isLoading}
                >
                  <div className="text-sm font-bold text-white/90">{type}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{detailsMap[type]}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Budget Selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-[#d4af37]" />
              Budget
            </label>
            <div className="relative">
              <select
                id="budget-select"
                value={budget}
                onChange={(e) => setBudget(e.target.value as ItineraryRequest["budget"])}
                className="w-full px-3.5 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all appearance-none cursor-pointer"
                disabled={isLoading}
              >
                <option value="Cheap" className="bg-[#0a0a0a] text-white">Cheap (Budget)</option>
                <option value="Moderate" className="bg-[#0a0a0a] text-white">Moderate (Comfort)</option>
                <option value="Luxury" className="bg-[#0a0a0a] text-white">Luxury (Premium)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2 flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-[#d4af37]" />
              Duration
            </label>
            <div className="relative">
              <select
                id="duration-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all appearance-none cursor-pointer"
                disabled={isLoading}
              >
                <option value="1 Day" className="bg-[#0a0a0a] text-white">1 Day</option>
                <option value="2 Days" className="bg-[#0a0a0a] text-white">2 Days</option>
                <option value="3 Days" className="bg-[#0a0a0a] text-white">3 Days</option>
                <option value="4 Days" className="bg-[#0a0a0a] text-white">4 Days</option>
                <option value="5 Days" className="bg-[#0a0a0a] text-white">5 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="generate-itinerary-btn"
          type="submit"
          disabled={isLoading || !destination.trim()}
          className="w-full bg-[#d4af37] hover:bg-[#bda030] disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-widest active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating Experience...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black fill-black" />
              <span>Generate Travel Plan</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
