"use client";

import "leaflet/dist/leaflet.css";
import type { CircleMarker, LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { appConfig } from "@/lib/config";
import { useOnline, useUi } from "@/lib/hooks";
import type { FacilityRecord, LatLng } from "@/lib/types/facility";

type Leaflet = typeof import("leaflet");

interface FacilityMapProps {
  facilities: FacilityRecord[];
  selectedId: string | null;
  origin: LatLng | null;
  onSelect: (id: string) => void;
}

const BRAND = "#c81e72";
const INK = "#2a1422";
// Roughly central Lagos, used only until facilities are drawn.
const LAGOS_CENTRE: [number, number] = [6.55, 3.4];

/**
 * Map of the facilities currently listed. The list beside it is the accessible way to
 * browse; the map mirrors it. Tiles come from the configured provider and are never
 * prefetched or stored for offline use.
 */
export function FacilityMap({ facilities, selectedId, origin, onSelect }: FacilityMapProps) {
  const { ui } = useUi();
  const online = useOnline();
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<{ L: Leaflet; map: LeafletMap; layer: LayerGroup; originLayer: LayerGroup } | null>(null);
  const markers = useRef(new Map<string, CircleMarker>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tilesFailing, setTilesFailing] = useState(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once. Leaflet needs `window`, so it is loaded in the browser only.
  useEffect(() => {
    let cancelled = false;
    const markerIndex = markers.current;
    import("leaflet")
      .then((module) => {
        const L = (module.default ?? module) as Leaflet;
        if (cancelled || !container.current) return;
        const map = L.map(container.current, {
          preferCanvas: true,
          center: LAGOS_CENTRE,
          zoom: 10,
          zoomControl: true,
          scrollWheelZoom: false,
        });
        const tiles = L.tileLayer(appConfig.map.tileUrl, {
          attribution: appConfig.map.attribution,
          maxZoom: appConfig.map.maxZoom,
        });
        tiles.on("tileerror", () => setTilesFailing(true));
        tiles.on("tileload", () => setTilesFailing(false));
        tiles.addTo(map);
        const layer = L.layerGroup().addTo(map);
        const originLayer = L.layerGroup().addTo(map);
        leaflet.current = { L, map, layer, originLayer };
        setReady(true);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      leaflet.current?.map.remove();
      leaflet.current = null;
      markerIndex.clear();
    };
  }, []);

  // Redraw markers whenever the listed facilities change, and fit the view to them.
  useEffect(() => {
    const current = leaflet.current;
    if (!ready || !current) return;
    const { L, map, layer } = current;
    layer.clearLayers();
    markers.current.clear();

    const points: [number, number][] = [];
    for (const facility of facilities) {
      if (!facility.location) continue;
      const { lat, lng } = facility.location.value;
      points.push([lat, lng]);
      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: BRAND,
        fillOpacity: 0.9,
      })
        .bindTooltip(facility.name.value)
        .on("click", () => onSelectRef.current(facility.id))
        .addTo(layer);
      markers.current.set(facility.id, marker);
    }
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 15 });
  }, [facilities, ready]);

  // Highlight and centre the selected facility.
  useEffect(() => {
    const current = leaflet.current;
    if (!ready || !current) return;
    for (const [id, marker] of markers.current) {
      const selected = id === selectedId;
      marker.setStyle({ radius: selected ? 12 : 7, fillColor: selected ? INK : BRAND, weight: selected ? 3 : 2 });
      if (selected) {
        marker.bringToFront();
        current.map.setView(marker.getLatLng(), Math.max(current.map.getZoom(), 14));
      }
    }
  }, [selectedId, ready, facilities]);

  // The person's own position, only while they have chosen to share it.
  useEffect(() => {
    const current = leaflet.current;
    if (!ready || !current) return;
    current.originLayer.clearLayers();
    if (origin) {
      current.L.circleMarker([origin.lat, origin.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#1d4ed8",
        fillOpacity: 1,
      }).addTo(current.originLayer);
    }
  }, [origin, ready]);

  // Offline, Leaflet itself may not have been cached yet, so offline is reported first.
  const problem = !online || tilesFailing ? ui.finder.mapOffline : failed ? ui.finder.mapError : null;

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-brand-50 shadow-soft">
      <div
        ref={container}
        role="region"
        aria-label={ui.finder.mapLabel}
        className="h-[min(22rem,55vh)] w-full lg:h-[min(40rem,calc(100vh-10rem))]"
      />
      {problem && (
        <p
          role="status"
          className="absolute inset-x-3 top-3 z-[1000] rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-2 text-base text-amber-950 shadow-soft"
        >
          {problem}
        </p>
      )}
    </div>
  );
}
