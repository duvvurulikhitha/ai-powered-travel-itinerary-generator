import React, { useState, useEffect } from "react";
import ItineraryForm from "./components/ItineraryForm";
import WanderMap from "./components/WanderMap";
import HotelSection from "./components/HotelSection";
import ItineraryTimeline from "./components/ItineraryTimeline";
import EmptyState from "./components/EmptyState";
import LeafletMapView from "./components/LeafletMapView";
import { TripItinerary, ItineraryRequest, Hotel, Activity } from "./types";
import { Compass, Sparkles, MapPin, History, RefreshCw, AlertTriangle, Trash2, Heart, Share2, Printer, Globe, CalendarRange, CloudSun, Wallet, Map } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SavedItinerary {
  id: string;
  request: ItineraryRequest;
  itinerary: TripItinerary;
  timestamp: string;
}

export default function App() {
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<ItineraryRequest | null>(null);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);

  // Synchronized active pin/timeline state
  const [activeItem, setActiveItem] = useState<{ type: "hotel" | "activity"; name: string } | null>(null);

  // Local storage travel history
  const [history, setHistory] = useState<SavedItinerary[]>([]);

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem("travel_itineraries_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing history:", e);
      }
    }
  }, []);

  // Save history helper
  const saveToHistory = (request: ItineraryRequest, data: TripItinerary) => {
    const newItem: SavedItinerary = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      request,
      itinerary: data,
      timestamp: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    const updated = [newItem, ...history.slice(0, 19)]; // Keep max 20 previous itineraries
    setHistory(updated);
    localStorage.setItem("travel_itineraries_history", JSON.stringify(updated));
  };

  // Delete from history
  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("travel_itineraries_history", JSON.stringify(updated));
    // If deleted the active one, clear active state or set to null
    if (itinerary && history.find((h) => h.id === id)?.itinerary.tripSummary === itinerary.tripSummary) {
      setItinerary(null);
      setCurrentRequest(null);
    }
  };

  const handleSelectHistoryItem = (item: SavedItinerary) => {
    setItinerary(item.itinerary);
    setCurrentRequest(item.request);
    setSelectedDay(1);
    setActiveItem(null);
    setError(null);
  };

  // Main Submit handler (calls full-stack Express server route)
  const handleGenerate = async (request: ItineraryRequest) => {
    setIsLoading(true);
    setError(null);
    setActiveItem(null);

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status code ${response.status}`);
      }

      const data: TripItinerary = await response.json();

      setItinerary(data);
      setCurrentRequest(request);
      setSelectedDay(1);

      // Save to local persistence list
      saveToHistory(request, data);
    } catch (err: any) {
      console.error("Error generating travel plan:", err);
      setError(err.message || "Failed to generate travel itinerary. Please verify your internet connection or check your GEMINI_API_KEY.");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset trigger for landing ideas
  const handleSelectPreset = (destination: string, companion: any, budget: any, duration: string) => {
    handleGenerate({
      destination,
      companionType: companion,
      budget,
      duration,
    });
  };

  // Map coordinate focusing helpers
  const handleSelectActivity = (activity: Activity) => {
    setActiveItem({ type: "activity", name: activity.placeName });
  };

  const handleSelectHotel = (hotel: Hotel) => {
    setActiveItem({ type: "hotel", name: hotel.hotelName });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans" id="app-root">
      {/* Top Navigation Bar */}
      <header className="bg-[#0a0a0a] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center text-black shadow-lg shadow-gold/10">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "25s" }} />
            </div>
            <div>
              <span className="text-base font-serif italic tracking-widest text-[#d4af37] block">
                Nomad.AI
              </span>
              <span className="text-[9px] font-mono text-white/40 font-bold uppercase tracking-widest block">
                Sophisticated Travel Synthesis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {itinerary && (
              <>
                <button
                  onClick={() => setIsFullScreenMap(!isFullScreenMap)}
                  className={`px-3.5 py-1.5 border rounded text-xs uppercase tracking-tighter flex items-center gap-1.5 cursor-pointer transition-all ${
                    isFullScreenMap
                      ? "bg-[#d4af37] border-[#d4af37] text-black font-bold shadow-lg shadow-[#d4af37]/25"
                      : "border-[#d4af37]/40 hover:bg-[#d4af37]/15 text-[#d4af37]"
                  }`}
                  title="Toggle Interactive Fullscreen Map View"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Interactive Map</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded text-xs uppercase tracking-tighter text-white/85 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Print Travel Itinerary"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Plan</span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 hidden md:block">
              System: <span className="text-green-500 font-bold">● Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form and Travel History Search logs */}
          <div className="lg:col-span-4 space-y-6">
            <ItineraryForm onSubmit={handleGenerate} isLoading={isLoading} />

            {/* Travel History Logs Side Card */}
            {history.length > 0 && (
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-5 shadow-sm space-y-4" id="history-panel">
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#d4af37]" />
                  Your Planned Trips ({history.length})
                </h4>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((item) => {
                    const isSelected = itinerary?.tripSummary === item.itinerary.tripSummary;
                    return (
                      <div
                        id={`history-item-${item.id}`}
                        key={item.id}
                        onClick={() => handleSelectHistoryItem(item)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                          isSelected
                            ? "border-gold bg-gold/10"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white/90 text-xs truncate leading-tight">
                            {item.request.destination}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-white/40 mt-1 font-mono">
                            <span>{item.request.duration}</span>
                            <span>•</span>
                            <span>{item.request.companionType}</span>
                          </div>
                          <span className="text-[8px] text-white/30 font-mono block mt-1.5">
                            {item.timestamp}
                          </span>
                        </div>

                        <button
                          id={`delete-history-${item.id}`}
                          onClick={(e) => deleteFromHistory(item.id, e)}
                          className="p-1 text-white/30 hover:text-red-400 rounded transition-colors"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive map dashboard, itinerary and stay lists */}
          <div className="lg:col-span-8 space-y-6">
            {/* Error Overlay Fallback view */}
            {error && (
              <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6 flex items-start gap-4" id="error-banner">
                <div className="p-2 bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-red-200 text-sm md:text-base">
                    Unable to generate itinerary
                  </h3>
                  <p className="text-xs md:text-sm text-red-400/80 leading-relaxed">
                    {error}
                  </p>
                  <button
                    id="retry-btn"
                    onClick={() => currentRequest && handleGenerate(currentRequest)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-900 hover:bg-red-800 text-white font-semibold text-xs rounded transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}

            {/* Display loading screen */}
            {isLoading && !itinerary && (
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[450px]" id="loading-state">
                <div className="relative w-20 h-20 mb-6">
                  {/* Glowing orbital loader */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <div className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <Compass className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-serif italic text-white">Synthesizing travel vectors...</h3>
                <p className="text-white/50 text-xs max-w-sm mt-1.5 leading-relaxed">
                  Nomad.AI is analyzing {currentRequest?.destination || "your destination"}, mapping local stays matching the {currentRequest?.budget || "Moderate"} tier, and constructing a bespoke travel experience.
                </p>
                <div className="mt-8 flex gap-2 justify-center flex-wrap max-w-md">
                  <span className="text-[9px] bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded font-mono uppercase tracking-wider animate-pulse">
                    Geolocating Hotels
                  </span>
                  <span className="text-[9px] bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded font-mono uppercase tracking-wider animate-pulse" style={{ animationDelay: "0.2s" }}>
                    Curating Local Gems
                  </span>
                  <span className="text-[9px] bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded font-mono uppercase tracking-wider animate-pulse" style={{ animationDelay: "0.4s" }}>
                    Aligning for {currentRequest?.companionType}
                  </span>
                </div>
              </div>
            )}

            {/* Result Dashboard view */}
            {itinerary && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
                id="itinerary-dashboard"
              >
                {/* Trip Overview Summary Badge */}
                <div className="bg-gradient-to-r from-[#0a0a0a] to-[#121212] border border-white/10 rounded-2xl overflow-hidden text-white shadow-md flex flex-col md:flex-row gap-6">
                  {itinerary.destinationImageUrl && (
                    <div className="w-full md:w-1/3 h-56 md:h-auto shrink-0 relative">
                      <img
                        src={itinerary.destinationImageUrl}
                        alt={currentRequest?.destination}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover animate-fade-in"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-transparent md:from-transparent md:to-[#0a0a0a]" />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-center space-y-3 relative z-10">
                    <div className="absolute right-0 bottom-0 translate-x-1/10 translate-y-1/10 pointer-events-none opacity-5">
                      <Compass className="w-64 h-64" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-gold/10 border border-gold/35 text-gold px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold">
                        {currentRequest?.companionType} Getaway
                      </span>
                      <span className="bg-white/5 border border-white/10 text-white/70 px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold">
                        {currentRequest?.budget} Budget
                      </span>
                      <span className="bg-white/5 border border-white/10 text-white/70 px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold">
                        {currentRequest?.duration} Duration
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif italic text-white tracking-wide">
                      Explore {currentRequest?.destination}
                    </h2>
                    <p className="text-white/80 text-sm leading-relaxed max-w-2xl font-medium italic">
                      "{itinerary.tripSummary}"
                    </p>
                  </div>
                </div>

                {/* Location Insights & Budget Breakdown Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="insights-section">
                  {/* Location Insights Card */}
                  <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[#d4af37]" />
                        Location Insights
                      </h3>
                      <div className="space-y-3.5 pt-2">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-[#d4af37] mt-1 shrink-0" />
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold block">Destination</span>
                            <p className="text-sm text-white/95 font-medium">
                              {itinerary.overallLocation?.city || currentRequest?.destination}
                              {itinerary.overallLocation?.country ? `, ${itinerary.overallLocation.country}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CalendarRange className="w-4 h-4 text-[#d4af37] mt-1 shrink-0" />
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold block">Best Season</span>
                            <p className="text-sm text-white/95 font-medium">{itinerary.overallLocation?.bestSeason || "Pleasant season"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CloudSun className="w-4 h-4 text-[#d4af37] mt-1 shrink-0" />
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold block">Weather & Atmosphere</span>
                            <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">{itinerary.overallLocation?.weatherSummary || "Ideal conditions for custom activities."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Breakdown Card */}
                  <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-[#d4af37]" />
                          Estimated Budget
                        </h3>
                        <div className="bg-gold/15 border border-gold/30 text-[#d4af37] px-3 py-1 rounded text-xs font-bold font-mono">
                          {itinerary.estimatedBudget?.totalEstimatedCost || "Estimating..."}
                        </div>
                      </div>
                      
                      <div className="space-y-3.5 pt-1">
                        {itinerary.estimatedBudget?.breakdown?.map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white/80 font-medium">{item.category}</span>
                              <span className="text-white font-semibold font-mono">{item.cost} ({item.percentage}%)</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gold h-full rounded-full transition-all duration-1000" 
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {!itinerary.estimatedBudget && (
                          <div className="text-xs text-white/40 text-center py-6">
                            Calculating dynamic pricing based on {currentRequest?.budget} tier...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Layout of Map & Detailed components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Map panel */}
                  <div className="h-full min-h-[480px]">
                    <WanderMap
                      itinerary={itinerary}
                      selectedDay={selectedDay}
                      onSelectActivity={handleSelectActivity}
                      onSelectHotel={handleSelectHotel}
                      activeItem={activeItem || undefined}
                    />
                  </div>

                  {/* Daily Schedule Vertical timeline */}
                  <div>
                    <ItineraryTimeline
                      itineraryDays={itinerary.itinerary}
                      selectedDay={selectedDay}
                      onSelectDay={(day) => {
                        setSelectedDay(day);
                        setActiveItem(null);
                      }}
                      onSelectActivity={handleSelectActivity}
                      activeActivityName={activeItem?.type === "activity" ? activeItem.name : undefined}
                      onViewOnMap={(activity) => {
                        setActiveItem({ type: "activity", name: activity.placeName });
                        setIsFullScreenMap(true);
                      }}
                    />
                  </div>
                </div>

                {/* Curated Hotel Stays section */}
                <HotelSection
                  hotels={itinerary.hotels}
                  onSelectHotel={handleSelectHotel}
                  activeHotelName={activeItem?.type === "hotel" ? activeItem.name : undefined}
                />
              </motion.div>
            )}

            {/* Default Landing Empty Dashboard */}
            {!itinerary && !isLoading && (
              <EmptyState 
                onSelectPreset={handleSelectPreset} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Immersive Fullscreen Interactive Leaflet Map View */}
      <AnimatePresence>
        {isFullScreenMap && itinerary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black"
          >
            <LeafletMapView
              itinerary={itinerary}
              selectedDay={selectedDay}
              activeItem={activeItem}
              onSelectActivity={handleSelectActivity}
              onSelectHotel={handleSelectHotel}
              onClose={() => setIsFullScreenMap(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer credit lines */}
      <footer className="bg-[#050505] border-t border-white/10 py-6 mt-12 text-center text-xs text-white/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest">
          <div>
            © 2026 Nomad.AI Travel Synthesis. Built in Google AI Studio.
          </div>
          <div className="flex gap-4">
            <span>Model: gemini-3.5-flash</span>
            <span>•</span>
            <span>JSON Data Synchronized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
