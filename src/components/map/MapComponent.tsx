"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSession } from "@/lib/auth-client";
import { Modal } from "@/components/ui/modal";

// Fix for default markers in React with Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface ActivityMarker {
  _id?: string;
  name: string;
  location: { lat: number; lng: number };
  hostId?: string;
  participants?: string[];
}

interface MapComponentProps {
  className?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: number; // in pixels, default larger map
  activities?: ActivityMarker[];
  onActivityCreated?: () => void;
  journeyActivities?: Array<{ location: { lat: number; lng: number }; createdAt?: string }>;
}

export default function MapComponent({ className = "", onLocationChange, height = 600, activities = [], onActivityCreated, journeyActivities = [] }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const activitiesLayerRef = useRef<L.LayerGroup | null>(null);
  const journeyLayerRef = useRef<L.Polyline | null>(null);
  const lastLatLngRef = useRef<L.LatLngExpression | null>(null);
  const [latInput, setLatInput] = useState<string>("");
  const [lngInput, setLngInput] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Create Activity form fields
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [budget, setBudget] = useState<string>("Free");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("Short (1–2h)");
  const [dateTime, setDateTime] = useState<string>("");
  const [locationType, setLocationType] = useState<string>("Outdoor");
  const [socialVibe, setSocialVibe] = useState<string>("Solo");
  const [tags, setTags] = useState<string[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<boolean>(false);
  const { data: session } = useSession();

  const [selectedActivity, setSelectedActivity] = useState<ActivityMarker & Record<string, any> | null>(null);
  const [weather, setWeather] = useState<{ tempC?: number; icon?: string; desc?: string } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map (center on Tunis, Tunisia)
    const map = L.map(mapRef.current).setView([36.8065, 10.1815], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // No default marker; user will set via inputs or click

    // Store map instance
    mapInstanceRef.current = map;
    // Layer for activities
    activitiesLayerRef.current = L.layerGroup().addTo(map);
    
    // Make joinActivity function available globally for popup buttons
    (window as any).joinActivity = handleJoinActivity;
    
    // Allow user to set location by clicking the map
    map.on("click", (evt: L.LeafletMouseEvent) => {
      const clicked = evt.latlng;
      const lat = clicked.lat;
      const lng = clicked.lng;
      setLatInput(String(lat));
      setLngInput(String(lng));
      placeOrMoveMarker([lat, lng]);
      const currentMap = mapInstanceRef.current;
      if (currentMap) {
        currentMap.setView(clicked, Math.max(currentMap.getZoom(), 16));
      }
      if (onLocationChange) onLocationChange(lat, lng);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      activitiesLayerRef.current = null;
      journeyLayerRef.current = null;
      delete (window as any).joinActivity;
    };
  }, []);

  // Render activities markers whenever activities or session changes
  useEffect(() => {
    const layer = activitiesLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    const typeToEmoji = (act: any): string => {
      const t = Array.isArray(act.types) && act.types.length ? act.types[0] : "";
      switch (t) {
        case "Outdoor": return "🥾";
        case "Food & Drinks": return "🍔";
        case "Music": return "🎶";
        case "City & Culture": return "🏙️";
        case "Wellness": return "🧘";
        case "Social": return "🫂";
        case "Work & Study": return "💻";
        case "Volunteering": return "🤝";
        default: return "📍";
      }
    };

    const makeIcon = (label: string) => L.divIcon({
      className: "custom-emoji-marker",
      html: `<div class="text-2xl select-none">${label}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const renderSingle = (act: any) => {
      const marker = L.marker([act.location.lat, act.location.lng], { icon: makeIcon(typeToEmoji(act)) });
      const userId = session?.user?.id as string | undefined;
      const isHost = !!(userId && act.hostId && act.hostId === userId);
      const alreadyJoined = !!(userId && act.participants && act.participants.includes(userId));

      const actionHtml = isHost
        ? `<span class=\"inline-block w-full text-center text-xs text-gray-500\">You are the host</span>`
        : alreadyJoined
          ? `<span class=\"inline-block w-full text-center text-xs text-gray-500\">Already joined</span>`
          : `<button onclick=\"joinActivity('${act._id}')\" class=\"w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-brand-500\">Join Activity</button>`;

      // Create popup content
      const popupContent = `
        <div class=\"p-2\">
          <h3 class=\"font-semibold text-gray-900 mb-2\">${act.name}</h3>
          <p class=\"text-sm text-gray-600 mb-3\">${act.location.lat.toFixed(5)}, ${act.location.lng.toFixed(5)}</p>
          ${actionHtml}
        </div>
      `;
      
      marker.bindPopup(popupContent);
      marker.addTo(layer);
      marker.on("click", () => {
        setSelectedActivity(act);
      });
    };

    // Simple grid-based clustering when many markers
    if (activities.length > 120) {
      const zoom = map.getZoom();
      const gridSize = Math.max(1, 20 - zoom); // larger grid at lower zooms
      const clusters: Record<string, { acts: any[]; lat: number; lng: number }> = {};
      for (const act of activities as any[]) {
        const keyLat = Math.round(act.location.lat * gridSize);
        const keyLng = Math.round(act.location.lng * gridSize);
        const key = `${keyLat}:${keyLng}`;
        if (!clusters[key]) clusters[key] = { acts: [], lat: act.location.lat, lng: act.location.lng };
        clusters[key].acts.push(act);
      }
      Object.values(clusters).forEach((c) => {
        if (c.acts.length === 1) {
          renderSingle(c.acts[0]);
        } else {
          const marker = L.marker([c.lat, c.lng], {
            icon: L.divIcon({
              className: "cluster-marker",
              html: `<div class="flex items-center justify-center rounded-full bg-brand-600 text-white text-sm h-8 w-8">${c.acts.length}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
          }).addTo(layer);
          marker.on("click", () => {
            map.setView([c.lat, c.lng], zoom + 2);
          });
        }
      });
    } else {
      (activities as any[]).forEach(renderSingle);
    }
  }, [activities, session]);

  // Journey polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (journeyLayerRef.current) {
      journeyLayerRef.current.removeFrom(map);
      journeyLayerRef.current = null;
    }
    const points = [...journeyActivities]
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      .map((a) => [a.location.lat, a.location.lng] as [number, number]);
    if (points.length >= 2) {
      const poly = L.polyline(points, { color: "#22c55e", weight: 3, opacity: 0.7 });
      poly.addTo(map);
      journeyLayerRef.current = poly;
    }
  }, [journeyActivities]);
  const canCreate = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    const validCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
    return validCoords && !saving;
  };

  const handleSubmitCreate = async () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (Number.isNaN(lat) || Number.isNaN(lng) || !title.trim()) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          title: title.trim(),
          description: description.trim(),
          budget,
          types: activityTypes,
          duration,
          dateTime,
          locationType,
          socialVibe,
          tags,
          sharedExpenses,
          location: { lat, lng },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Failed to create activity");
      }
      // reset form
      setTitle("");
      setDescription("");
      setBudget("Free");
      setActivityTypes([]);
      setDuration("Short (1–2h)");
      setDateTime("");
      setLocationType("Outdoor");
      setSocialVibe("Solo");
      setTags([]);
      setSharedExpenses(false);
      setIsCreateOpen(false);
      if (onActivityCreated) onActivityCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleJoinActivity = async (activityId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/activities/${activityId}/join`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Failed to join activity");
      }
      if (onActivityCreated) onActivityCreated(); // Refresh activities
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const placeOrMoveMarker = (latlng: L.LatLngExpression) => {
    const currentMap = mapInstanceRef.current;
    if (!currentMap) return;
    lastLatLngRef.current = latlng;
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latlng).addTo(currentMap).bindPopup("Selected location");
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }
  };

  const applyInputsToMarker = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    const isLatValid = !Number.isNaN(lat) && lat >= -90 && lat <= 90;
    const isLngValid = !Number.isNaN(lng) && lng >= -180 && lng <= 180;
    if (!isLatValid || !isLngValid) return;
    placeOrMoveMarker([lat, lng]);
    const currentMap = mapInstanceRef.current;
    if (currentMap) {
      currentMap.setView([lat, lng], Math.max(currentMap.getZoom(), 16));
    }
    if (onLocationChange) onLocationChange(lat, lng);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            placeholder="e.g. 36.8065"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            placeholder="e.g. 10.1815"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <button
            type="button"
            onClick={applyInputsToMarker}
            className="inline-flex h-[42px] mt-6 items-center justify-center rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Set location
          </button>
        </div>
        <div>
          <button
            type="button"
            disabled={!canCreate()}
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-[42px] mt-6 items-center justify-center rounded bg-brand-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
          >
            Create an activity at this location
          </button>
        </div>
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-lg"
        style={{ minHeight: `${height}px`, height: `${height}px` }}
      />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Activity</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Latitude</label>
              <input
                type="text"
                value={latInput}
                readOnly
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Longitude</label>
              <input
                type="text"
                value={lngInput}
                readOnly
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              placeholder="e.g., Sunrise Hike"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              placeholder="What are we doing? Any tips or requirements?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Budget</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              >
                {["Free", "Low", "Medium", "High", "Luxury"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              >
                {["Short (1–2h)", "Half-day", "Full-day", "Multi-day"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date & time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location type</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              >
                {["Outdoor", "Indoor", "Weather-friendly"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Social vibe</label>
              <select
                value={socialVibe}
                onChange={(e) => setSocialVibe(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
              >
                {["Solo", "Small group", "Public", "Friends-only", "Couples"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Activity type</label>
              <div className="flex flex-wrap gap-2">
                {["Outdoor", "Food & Drinks", "Music", "City & Culture", "Wellness", "Social", "Work & Study", "Volunteering"].map((t) => {
                  const active = activityTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setActivityTypes((prev) =>
                          prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-sm border ${active ? "bg-brand-600 text-white border-brand-600" : "bg-gray-800 text-gray-200 border-gray-600"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {["Featured", "Trending", "New", "Hidden gem", "Eco-friendly"].map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
                    }
                    className={`px-3 py-1 rounded-full text-sm border ${active ? "bg-gray-200 text-gray-900 border-gray-200" : "bg-gray-800 text-gray-200 border-gray-600"}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Shared expenses</label>
            <button
              type="button"
              onClick={() => setSharedExpenses((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sharedExpenses ? "bg-brand-600" : "bg-gray-600"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${sharedExpenses ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded border border-gray-600 px-4 text-gray-200"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!title.trim() || saving}
              onClick={handleSubmitCreate}
              className="inline-flex h-10 items-center justify-center rounded bg-brand-600 px-4 text-white disabled:opacity-50 hover:bg-brand-700"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Activity Details Modal */}
      <Modal isOpen={!!selectedActivity} onClose={() => setSelectedActivity(null)} className="max-w-2xl w-full p-6">
        {selectedActivity && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-100">{selectedActivity.title || selectedActivity.name}</h2>
                <div className="text-sm text-gray-400">
                  {selectedActivity.location.lat.toFixed(5)}, {selectedActivity.location.lng.toFixed(5)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Array.isArray(selectedActivity.types) && selectedActivity.types.slice(0, 4).map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-gray-800 border border-gray-600 text-gray-200">{t}</span>
                ))}
              </div>
            </div>

            {selectedActivity.description && (
              <p className="text-gray-300 text-sm">{selectedActivity.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-gray-400">Budget</div>
                <div className="text-gray-100">{selectedActivity.budget || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-400">Date & time</div>
                <div className="text-gray-100">{selectedActivity.dateTime ? new Date(selectedActivity.dateTime).toLocaleString() : "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-400">Duration</div>
                <div className="text-gray-100">{selectedActivity.duration || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-400">Participants</div>
                <div className="text-gray-100">{Array.isArray(selectedActivity.participants) ? selectedActivity.participants.length : 0}</div>
              </div>
            </div>

            {/* Weather Widget */}
            <WeatherWidget
              lat={selectedActivity.location.lat}
              lng={selectedActivity.location.lng}
              when={selectedActivity.dateTime}
            />

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                {Array.isArray(selectedActivity.tags) && selectedActivity.tags.slice(0, 6).map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-200">{t}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedActivity && selectedActivity._id) {
                      handleJoinActivity(String(selectedActivity._id));
                    }
                  }}
                  className="inline-flex h-10 items-center justify-center rounded bg-brand-600 px-4 text-white hover:bg-brand-700"
                >
                  Join Activity
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function WeatherWidget({ lat, lng, when }: { lat: number; lng: number; when?: string }) {
  const [data, setData] = useState<{ temp: number; icon: string; desc: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      setErr("Weather unavailable");
      return;
    }
    // Use current weather for simplicity; forecast API could be used with 'when'
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed weather"))))
      .then((j) => {
        const temp = Math.round(j.main?.temp ?? 0);
        const icon = j.weather?.[0]?.icon ?? "01d";
        const desc = j.weather?.[0]?.main ?? "";
        setData({ temp, icon, desc });
      })
      .catch(() => setErr("Weather unavailable"));
  }, [lat, lng, when]);

  return (
    <div className="flex items-center gap-3 rounded border border-gray-700 p-3 bg-gray-800">
      {data ? (
        <>
          <img src={`https://openweathermap.org/img/wn/${data.icon}.png`} alt="" className="h-8 w-8" />
          <div className="text-sm text-gray-100">{data.temp}°C — {data.desc}</div>
        </>
      ) : (
        <div className="text-sm text-gray-400">{err || "Loading weather..."}</div>
      )}
    </div>
  );
}
