import React from "react";
import { Compass, Sparkles, Map, Heart, Backpack, Globe } from "lucide-react";

const POPULAR_IDEAS = [
  { city: "Kyoto, Japan", type: "Family", budget: "Moderate", duration: "4 Days", icon: "🌸" },
  { city: "Paris, France", type: "A Couple", budget: "Luxury", duration: "3 Days", icon: "🗼" },
  { city: "New York, USA", type: "Friends", budget: "Moderate", duration: "5 Days", icon: "🗽" },
  { city: "Reykjavik, Iceland", type: "Just Me", budget: "Luxury", duration: "4 Days", icon: "🌋" },
];

interface EmptyStateProps {
  onSelectPreset: (destination: string, companion: any, budget: any, duration: string) => void;
}

export default function EmptyState({ onSelectPreset }: EmptyStateProps) {
  return (
    <div className="bg-[#080808] border border-white/10 rounded-2xl p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6" id="empty-state-container">
      {/* Decorative Icon Grid */}
      <div className="flex justify-center gap-4 text-slate-300">
        <div className="p-4 bg-gold/10 rounded-full border border-gold/30 text-gold animate-bounce" style={{ animationDuration: "3s" }}>
          <Compass className="w-8 h-8" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-serif italic text-white tracking-wide">
          Your AI Travel Itinerary Assistant
        </h2>
        <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
          Describe any destination worldwide, and Gemini will craft a custom, coordinate-accurate travel schedule tailored perfectly to your companion, budget, and duration.
        </p>
      </div>

      {/* Suggested Quick Starts */}
      <div className="space-y-3 pt-4">
        <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] text-left flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          Need Inspiration? Instant Travel Ideas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_IDEAS.map((idea, idx) => (
            <button
              id={`popular-idea-${idx}`}
              key={idx}
              type="button"
              onClick={() => onSelectPreset(idea.city, idea.type, idea.budget, idea.duration)}
              className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-gold hover:bg-gold/5 text-left transition-all group cursor-pointer flex items-center gap-3"
            >
              <div className="text-2xl p-2 bg-white/5 rounded-xl group-hover:bg-gold/10 shrink-0 transition-colors">
                {idea.icon}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                  <span className="truncate">{idea.city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-1 font-mono">
                  <span>{idea.type}</span>
                  <span>•</span>
                  <span>{idea.budget}</span>
                  <span>•</span>
                  <span>{idea.duration}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Badge */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-medium text-white/60">
          <Globe className="w-3.5 h-3.5 text-gold animate-spin" style={{ animationDuration: "12s" }} />
          <span>Complete database covering 200+ countries with geocoded pins</span>
        </div>
      </div>
    </div>
  );
}
