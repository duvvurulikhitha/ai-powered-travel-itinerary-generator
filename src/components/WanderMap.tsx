import React, { useState, useEffect, useRef } from "react";
import { TripItinerary, Hotel, Activity, GeoCoordinates } from "../types";
import { MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw, Building, Map as MapIcon, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WanderMapProps {
  itinerary: TripItinerary;
  selectedDay: number;
  onSelectActivity?: (activity: Activity) => void;
  onSelectHotel?: (hotel: Hotel) => void;
  activeItem?: { type: "hotel" | "activity"; name: string };
}

interface MapPinItem {
  id: string;
  name: string;
  type: "hotel" | "activity";
  coordinates: GeoCoordinates;
  details: string;
  pricingOrPriceRange: string;
  dayNumber?: number;
}

export default function WanderMap({
  itinerary,
  selectedDay,
  onSelectActivity,
  onSelectHotel,
  activeItem,
}: WanderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<MapPinItem | null>(null);

  // Resize observer to update dimensions automatically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(300, entry.contentRect.width),
          height: Math.max(300, entry.contentRect.height || 420),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset zoom and pan when itinerary or day changes
  useEffect(() => {
    handleReset();
  }, [itinerary, selectedDay]);

  // Gather all pinning coordinates
  const pins: MapPinItem[] = [];

  // Add hotels to map
  itinerary.hotels.forEach((hotel, idx) => {
    pins.push({
      id: `hotel-${idx}`,
      name: hotel.hotelName,
      type: "hotel",
      coordinates: hotel.geoCoordinates,
      details: hotel.description,
      pricingOrPriceRange: hotel.priceRange,
    });
  });

  // Add activities for selected day to map
  const activeDayData = itinerary.itinerary.find((d) => d.dayNumber === selectedDay);
  if (activeDayData) {
    activeDayData.activities.forEach((activity, idx) => {
      pins.push({
        id: `activity-${selectedDay}-${idx}`,
        name: activity.placeName,
        type: "activity",
        coordinates: activity.geoCoordinates,
        details: activity.placeDetails,
        pricingOrPriceRange: activity.ticketPricing,
        dayNumber: selectedDay,
      });
    });
  }

  // Calculate latitude & longitude bounding box for Auto Fit
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  if (pins.length > 0) {
    pins.forEach((p) => {
      const { lat, lng } = p.coordinates;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  } else {
    minLat = 48.8; maxLat = 48.9; minLng = 2.2; maxLng = 2.4;
  }

  const latDelta = maxLat - minLat === 0 ? 0.05 : maxLat - minLat;
  const lngDelta = maxLng - minLng === 0 ? 0.05 : maxLng - minLng;

  const marginFactor = 0.25;
  const bounds = {
    minLat: minLat - latDelta * marginFactor,
    maxLat: maxLat + latDelta * marginFactor,
    minLng: minLng - lngDelta * marginFactor,
    maxLng: maxLng + lngDelta * marginFactor,
  };

  const currentLatDelta = bounds.maxLat - bounds.minLat;
  const currentLngDelta = bounds.maxLng - bounds.minLng;

  // Convert real lat/lng coordinates to SVG pixels
  const getXY = (coords: GeoCoordinates) => {
    const { lat, lng } = coords;
    const rawX = ((lng - bounds.minLng) / currentLngDelta) * dimensions.width;
    const rawY = ((bounds.maxLat - lat) / currentLatDelta) * dimensions.height;

    // Apply Zoom & Pan Offset around the center of the canvas
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const x = centerX + (rawX - centerX) * zoom + panOffset.x;
    const y = centerY + (rawY - centerY) * zoom + panOffset.y;

    return { x, y };
  };

  // Drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.3, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z * 0.7, 0.4));

  const activityPoints = pins
    .filter((p) => p.type === "activity")
    .map((p) => ({ ...p, xy: getXY(p.coordinates) }));

  const isPinActive = (pin: MapPinItem) => {
    if (!activeItem) return false;
    return activeItem.type === pin.type && activeItem.name === pin.name;
  };

  return (
    <div className="bg-[#080808] border border-white/10 rounded-2xl p-5 relative overflow-hidden flex flex-col h-full shadow-lg select-none" id="wander-map-container">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gold/10 border border-gold/25 rounded-lg text-gold">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif italic text-white tracking-wide">
              Interactive WanderMap™
            </h3>
            <p className="text-xxs text-white/40 font-mono uppercase tracking-wider">
              Day {selectedDay} route overlay & pinned coordinates
            </p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            id="map-zoom-in"
            onClick={handleZoomIn}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded border border-white/5 hover:text-white transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="map-zoom-out"
            onClick={handleZoomOut}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded border border-white/5 hover:text-white transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="map-reset"
            onClick={handleReset}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded border border-white/5 hover:text-white transition-all cursor-pointer"
            title="Recenter Map"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Viewport Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 min-h-[360px] bg-[#030303] rounded-xl relative overflow-hidden border border-white/10 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        id="map-viewport"
      >
        {/* Radar Coordinates Overlay decoration */}
        <div className="absolute top-2.5 left-3 pointer-events-none text-white/25 font-mono text-[9px] flex flex-col gap-0.5 z-10">
          <span>BOUNDS: S_LAT {bounds.minLat.toFixed(4)}° / W_LNG {bounds.minLng.toFixed(4)}°</span>
          <span>CENTER: LAT {((bounds.minLat + bounds.maxLat) / 2).toFixed(4)}°</span>
        </div>

        {/* Tactical Compass decoration */}
        <div className="absolute bottom-3 right-3 pointer-events-none text-white/20 flex items-center gap-1.5 opacity-60 text-[10px] font-mono z-10">
          <Compass className="w-5 h-5 text-gold animate-pulse" />
          <span>TRUE NORTH</span>
        </div>

        {/* Main Canvas Canvas Grid / SVG Elements */}
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 pointer-events-none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#030303" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#map-glow)" />

          {/* Draw Latitude and Longitude Lines/Ticks on borders */}
          <line x1="20" y1="0" x2="20" y2={dimensions.height} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" strokeDasharray="2,5" />
          <line x1="0" y1={dimensions.height - 20} x2={dimensions.width} y2={dimensions.height - 20} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" strokeDasharray="2,5" />

          {/* Pathway lines between consecutive activities */}
          {activityPoints.length > 1 && (
            <g>
              <path
                d={activityPoints.reduce(
                  (acc, curr, idx) => acc + `${idx === 0 ? "M" : "L"} ${curr.xy.x} ${curr.xy.y}`,
                  ""
                )}
                fill="none"
                stroke="#d4af37"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.25"
              />
              <path
                d={activityPoints.reduce(
                  (acc, curr, idx) => acc + `${idx === 0 ? "M" : "L"} ${curr.xy.x} ${curr.xy.y}`,
                  ""
                )}
                fill="none"
                stroke="#d4af37"
                strokeWidth="1.5"
                strokeDasharray="6,4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
                className="animate-[dash_20s_linear_infinite]"
              />
            </g>
          )}

          {/* Pathways from first hotel to first activity */}
          {pins.some((p) => p.type === "hotel") && activityPoints.length > 0 && (
            <line
              x1={getXY(pins.find((p) => p.type === "hotel")!.coordinates).x}
              y1={getXY(pins.find((p) => p.type === "hotel")!.coordinates).y}
              x2={activityPoints[0].xy.x}
              y2={activityPoints[0].xy.y}
              stroke="#d4af37"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.4"
            />
          )}
        </svg>

        {/* Real HTML Element Pin Layers Overlay */}
        {pins.map((pin) => {
          const { x, y } = getXY(pin.coordinates);
          const isActive = isPinActive(pin);
          const isHotel = pin.type === "hotel";

          if (x < -50 || x > dimensions.width + 50 || y < -50 || y > dimensions.height + 50) {
            return null;
          }

          return (
            <div
              key={pin.id}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
                zIndex: isActive ? 40 : 20,
              }}
              className="absolute group pointer-events-auto"
            >
              {isActive && (
                <div
                  className="absolute -inset-4 rounded-full animate-ping opacity-35 bg-gold"
                  style={{ animationDuration: "1.8s" }}
                />
              )}

              <button
                id={`map-pin-${pin.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isHotel && onSelectHotel) {
                    onSelectHotel(itinerary.hotels.find((h) => h.hotelName === pin.name)!);
                  } else if (!isHotel && onSelectActivity) {
                    const act = activeDayData?.activities.find((a) => a.placeName === pin.name);
                    if (act) onSelectActivity(act);
                  }
                }}
                onMouseEnter={() => setHoveredPin(pin)}
                onMouseLeave={() => setHoveredPin(null)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center border shadow-md transition-all duration-300 transform cursor-pointer hover:scale-125 hover:z-50 ${
                  isActive
                    ? "bg-gold border-white text-black scale-110 font-bold"
                    : "bg-[#0a0a0a] border-gold/40 text-gold hover:border-gold hover:text-white"
                }`}
              >
                {isHotel ? (
                  <Building className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold font-mono">
                    {pins.filter((p) => p.type === "activity").indexOf(pin) + 1}
                  </span>
                )}
              </button>

              {!isHotel && !isActive && (
                <div className="absolute -top-1.5 -right-1.5 bg-black border border-white/10 px-1 rounded text-[8px] font-mono text-gold font-bold pointer-events-none scale-90">
                  D{selectedDay}
                </div>
              )}
            </div>
          );
        })}

        {/* Hover Popover Tooltip */}
        <AnimatePresence>
          {hoveredPin && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0a0a0a]/95 border border-white/10 rounded-xl p-3.5 shadow-xl max-w-[280px] w-full backdrop-blur-md pointer-events-none z-50 flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold bg-gold/10 text-gold border border-gold/25">
                  {hoveredPin.type === "hotel" ? "Recommended Hotel" : `Activity Point`}
                </span>
                <span className="text-[10px] font-mono font-bold text-white/40">{hoveredPin.pricingOrPriceRange}</span>
              </div>
              <h4 className="text-xs font-serif italic text-white leading-snug">{hoveredPin.name}</h4>
              <p className="text-[10px] text-white/60 leading-relaxed line-clamp-2">{hoveredPin.details}</p>
              <div className="flex items-center gap-1 text-[9px] text-white/30 font-mono mt-0.5">
                <Navigation className="w-2.5 h-2.5 text-white/30" />
                <span>{hoveredPin.coordinates.lat.toFixed(4)}°, {hoveredPin.coordinates.lng.toFixed(4)}°</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Legend Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 text-[10px] text-white/40 border-t border-white/5 pt-3 font-mono uppercase tracking-wider gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gold/15 border border-gold flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-gold" />
            </span>
            <span>Hotel Stay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/30 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white/50" />
            </span>
            <span>Day Attraction</span>
          </div>
        </div>
        <div className="text-white/30 text-[9px]">
          Scale: Dynamic Auto-fit
        </div>
      </div>
    </div>
  );
}
