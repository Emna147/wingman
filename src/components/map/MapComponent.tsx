"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSession } from "@/lib/auth-client";

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
}

export default function MapComponent({ className = "", onLocationChange, height = 600, activities = [], onActivityCreated }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const activitiesLayerRef = useRef<L.LayerGroup | null>(null);
  const lastLatLngRef = useRef<L.LatLngExpression | null>(null);
  const [latInput, setLatInput] = useState<string>("");
  const [lngInput, setLngInput] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([51.505, -0.09], 13);

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
      delete (window as any).joinActivity;
    };
  }, []);

  // Render activities markers whenever activities or session changes
  useEffect(() => {
    const layer = activitiesLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    activities.forEach((act) => {
      const marker = L.marker([act.location.lat, act.location.lng]);
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
    });
  }, [activities, session]);

  const canCreate = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    const validCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
    return validCoords && name.trim().length > 0 && !saving;
  };

  const handleCreate = async () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (Number.isNaN(lat) || Number.isNaN(lng) || !name.trim()) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), location: { lat, lng } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.error || "Failed to create activity");
      }
      setName("");
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activity name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning run"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <button
            type="button"
            disabled={!canCreate()}
            onClick={handleCreate}
            className="inline-flex h-[42px] mt-6 items-center justify-center rounded bg-brand-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
          >
            {saving ? "Saving..." : "Create an activity at this location"}
          </button>
        </div>
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-lg"
        style={{ minHeight: `${height}px`, height: `${height}px` }}
      />
    </div>
  );
}
