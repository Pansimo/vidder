'use client';

import type { StoryCardData, RouteCardData } from '@/lib/types';
import { mapboxStaticUrl } from '../storyUtils';

interface RouteCardProps {
  data: StoryCardData;
}

/**
 * Decimate points by picking every Nth point to stay within
 * Mapbox Static Images API URL length limits (~8192 chars).
 * This is simple uniform sampling — not Douglas-Peucker —
 * which is acceptable for v1 but may lose shape detail on
 * complex routes. See report for evaluation.
 */
const MAX_POLYLINE_POINTS = 100;

function decimatePoints(points: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> {
  if (points.length <= MAX_POLYLINE_POINTS) return points;
  const step = (points.length - 1) / (MAX_POLYLINE_POINTS - 1);
  const result: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < MAX_POLYLINE_POINTS; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}

/**
 * Google Encoded Polyline (precision 5) — same algorithm as Flutter's
 * mapbox_static.dart:_encodePolyline. Mapbox Static API path overlay
 * requires this format; raw coordinate pairs are not supported.
 */
function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
  let prevLat = 0;
  let prevLng = 0;
  let result = '';
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    result += encodeValue(lat - prevLat);
    result += encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return encodeURIComponent(result);
}

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let result = '';
  while (v >= 0x20) {
    result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  result += String.fromCharCode(v + 63);
  return result;
}

function buildPathOverlay(points: Array<{ lat: number; lng: number }>): string {
  const decimated = decimatePoints(points);
  const encoded = encodePolyline(decimated);
  return `path-2+0009AB-0.8(${encoded})`;
}

export default function RouteCard({ data }: RouteCardProps) {
  const d = data as RouteCardData;
  const points = d.points;
  const hasPoints = Array.isArray(points) && points.length >= 2;

  const mapUrl = hasPoints
    ? mapboxStaticUrl(
        buildPathOverlay(points),
        d.map_style || 'light-v11',
        d.map_size || '800x600@2x',
        d.map_padding ?? 60,
      )
    : null;

  return (
    <div className="relative flex h-full w-full items-center justify-center" style={{ backgroundColor: '#F0F2F5' }}>
      {mapUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mapUrl} alt="Rutt" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="text-5xl">🗺️</span>
          <p className="text-sm font-medium">Rutt</p>
        </div>
      )}

      {/* Title overlay if present */}
      {d.title && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent px-6 pb-10 pt-16">
          <p className="text-lg font-bold text-white">{d.title}</p>
        </div>
      )}
    </div>
  );
}
