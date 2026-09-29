import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { NGO, User, InspectionRecord } from '../types';
import { Layers, Maximize2, MapPin, Compass } from 'lucide-react';

export type MapTileMode = 'GOOGLE_ROADS' | 'GOOGLE_HYBRID' | 'GOOGLE_SATELLITE' | 'GOOGLE_TERRAIN' | 'OSM';

interface TileConfig {
  url: string;
  subdomains: string[];
  maxZoom: number;
  attribution: string;
  label: string;
  icon: string;
}

const TILE_CONFIGS: Record<MapTileMode, TileConfig> = {
  GOOGLE_ROADS: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps &bull; Govt of Maharashtra GIS',
    label: 'Google Roads',
    icon: '🗺️',
  },
  GOOGLE_HYBRID: {
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Satellite &bull; Govt of Maharashtra GIS',
    label: 'Google Hybrid',
    icon: '🛰️',
  },
  GOOGLE_SATELLITE: {
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Imagery &bull; Govt of Maharashtra GIS',
    label: 'Google Satellite',
    icon: '🛰️',
  },
  GOOGLE_TERRAIN: {
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Terrain &bull; Govt of Maharashtra GIS',
    label: 'Google Terrain',
    icon: '🏔️',
  },
  OSM: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &bull; NIC Gov GIS Layer',
    label: 'OpenStreetMap (NIC)',
    icon: '🌐',
  },
};

export const MAHARASHTRA_DISTRICT_PRESETS = [
  { name: '📍 All Maharashtra State', center: [19.25, 75.60] as [number, number], zoom: 7 },
  { name: 'Latur (Ausa Road / Rajiv Gandhi Chowk)', center: [18.4088, 76.5604] as [number, number], zoom: 13 },
  { name: 'Mumbai City (Fort / Colaba)', center: [18.9345, 72.8354] as [number, number], zoom: 13 },
  { name: 'Mumbai Suburban (Andheri / BKC)', center: [19.0600, 72.8656] as [number, number], zoom: 12 },
  { name: 'Pune (Shivajinagar / Kothrud / Warje)', center: [18.5284, 73.8423] as [number, number], zoom: 12 },
  { name: 'Nagpur (Civil Lines / Butibori)', center: [21.1524, 79.0732] as [number, number], zoom: 12 },
  { name: 'Ahmednagar (Ralegan Siddhi / MIDC)', center: [19.0948, 74.7480] as [number, number], zoom: 12 },
  { name: 'Chandrapur (Anandwan / Warora)', center: [20.4077, 79.0084] as [number, number], zoom: 13 },
  { name: 'Gadchiroli (Hemalkasa / Shodhgram)', center: [20.1772, 80.0039] as [number, number], zoom: 11 },
  { name: 'Nashik (Gangapur / Panchavati)', center: [20.0125, 73.7634] as [number, number], zoom: 12 },
  { name: 'Chhatrapati Sambhajinagar (CIDCO)', center: [19.8762, 75.3621] as [number, number], zoom: 12 },
  { name: 'Thane / Navi Mumbai (Vashi)', center: [19.0771, 72.9986] as [number, number], zoom: 12 },
  { name: 'Jalgaon (Manobal Campus)', center: [21.0077, 75.5626] as [number, number], zoom: 12 },
  { name: 'Beed (Shantiwan / Arvi)', center: [19.0321, 75.7621] as [number, number], zoom: 12 },
  { name: 'Wardha (Sevagram Ashram)', center: [20.7103, 78.6183] as [number, number], zoom: 13 },
  { name: 'Kolhapur (Shahupuri)', center: [16.7028, 74.2415] as [number, number], zoom: 12 },
  { name: 'Solapur (Navi Peth)', center: [17.6698, 75.9064] as [number, number], zoom: 12 },
  { name: 'Amravati (Achalpur / Melghat)', center: [21.2582, 77.5122] as [number, number], zoom: 11 },
  { name: 'Nanded (VIP Road / Kinwat)', center: [19.1582, 77.3167] as [number, number], zoom: 12 },
  { name: 'Satara (Powai Naka / Mahabaleshwar)', center: [17.6805, 74.0183] as [number, number], zoom: 12 },
  { name: 'Raigad (Mahad / Uran)', center: [18.2325, 73.4182] as [number, number], zoom: 12 },
  { name: 'Ratnagiri (Shivaji Nagar / Mirkarwada)', center: [16.9902, 73.3120] as [number, number], zoom: 12 },
  { name: 'Sindhudurg (Malvan / Kudal)', center: [16.0617, 73.4735] as [number, number], zoom: 12 },
  { name: 'Dhule (Agra Road / Deopur)', center: [20.9042, 74.7749] as [number, number], zoom: 12 },
];

interface InteractiveMapProps {
  ngos: NGO[];
  officers?: User[];
  activeInspection?: InspectionRecord | null;
  selectedNgo?: NGO | null;
  onSelectNgo?: (ngo: NGO) => void;
  heightClass?: string;
  showAllOfficers?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  ngos,
  officers = [],
  activeInspection,
  selectedNgo,
  onSelectNgo,
  heightClass = 'h-96 md:h-[480px]',
  showAllOfficers = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Default to Google Roadmap tiles
  const [mapType, setMapType] = useState<MapTileMode>('GOOGLE_ROADS');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('📍 All Maharashtra State');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Geographic center of Maharashtra state
  const MAHARASHTRA_CENTER: [number, number] = [19.25, 75.60];
  const MAHARASHTRA_DEFAULT_ZOOM = 7;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around Maharashtra state or selected NGO
    const defaultCenter: [number, number] = (selectedNgo && selectedNgo.coordinates && typeof selectedNgo.coordinates.lat === 'number')
      ? [selectedNgo.coordinates.lat, selectedNgo.coordinates.lng]
      : MAHARASHTRA_CENTER;

    const initialZoom = selectedNgo ? 13 : MAHARASHTRA_DEFAULT_ZOOM;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Default to Google Maps Roadmap Tiles
      const cfg = TILE_CONFIGS.GOOGLE_ROADS;
      const initialTileLayer = L.tileLayer(cfg.url, {
        subdomains: cfg.subdomains,
        maxZoom: cfg.maxZoom,
        attribution: cfg.attribution,
      });

      initialTileLayer.addTo(map);
      tileLayerRef.current = initialTileLayer;

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Attach ResizeObserver to handle container size changes cleanly
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    // Full cleanup on unmount to prevent "Map container is already initialized" error
    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Handle Map Type Toggle (Google Roads / Hybrid / Satellite / Terrain / OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[mapType];
    const newTiles = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains,
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    });

    newTiles.addTo(map);
    tileLayerRef.current = newTiles;
  }, [mapType]);

  // Update markers when NGOs, officers, or selected NGO change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Custom Icon Creators
    const createNgoIcon = (status: NGO['status'], isSelected: boolean) => {
      let bg = '#10b981'; // emerald
      let label = '🏢';
      if (status === 'UNDER_INSPECTION') {
        bg = '#f59e0b'; // amber
        label = '🔍';
      } else if (status === 'FLAGGED_VIOLATION') {
        bg = '#ef4444'; // rose/red
        label = '⚠️';
      } else if (status === 'PENDING_APPROVAL') {
        bg = '#8b5cf6'; // purple
        label = '⏳';
      }

      const ringStyle = isSelected ? 'border: 3px solid #facc15; box-shadow: 0 0 15px rgba(250, 204, 21, 0.9);' : 'border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4);';

      return L.divIcon({
        className: 'custom-ngo-pin',
        html: `
          <div style="
            background: ${bg};
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            ${ringStyle}
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <span style="transform: rotate(45deg); font-size: 15px;">${label}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });
    };

    const createOfficerIcon = (name: string, isLive: boolean) => {
      return L.divIcon({
        className: 'custom-officer-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${isLive ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(30, 64, 175, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
            <div style="
              background: #1e40af;
              color: white;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(30, 64, 175, 0.6);
              font-weight: bold;
              font-size: 14px;
              z-index: 10;
            ">
              👮
            </div>
            <div style="
              position: absolute;
              bottom: -18px;
              background: #0f172a;
              color: white;
              font-size: 9px;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
              white-space: nowrap;
              box-shadow: 0 2px 5px rgba(0,0,0,0.5);
              border: 1px solid rgba(255,255,255,0.2);
            ">
              ${name.split(' ')[1] || name}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });
    };

    // Render NGOs
    ngos.forEach((ngo) => {
      if (!ngo?.coordinates || typeof ngo.coordinates.lat !== 'number' || typeof ngo.coordinates.lng !== 'number') return;
      const isSelected = selectedNgo?.id === ngo.id;
      const marker = L.marker([ngo.coordinates.lat, ngo.coordinates.lng], {
        icon: createNgoIcon(ngo.status, isSelected),
      });

      const googleMapsUrl = ngo.googleMapsUrl || `https://www.google.com/maps?q=${ngo.coordinates.lat},${ngo.coordinates.lng}`;

      const verificationBadge = ngo.verificationStatus ? `
        <div style="margin-top: 3px; margin-bottom: 4px;">
          <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; border: 1px solid ${
            ngo.verificationStatus.includes('Confirmed') ? '#86efac' : '#fde68a'
          }; background: ${
            ngo.verificationStatus.includes('Confirmed') ? '#f0fdf4' : '#fffbeb'
          }; color: ${
            ngo.verificationStatus.includes('Confirmed') ? '#166534' : '#92400e'
          };">
            ${ngo.verificationStatus.includes('Confirmed') ? '✓ ' : '⚠️ '}${ngo.verificationStatus}
          </span>
        </div>
      ` : '';

      const schemeBadges = (ngo.scheme || ngo.ngoType) ? `
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px;">
          ${ngo.scheme ? `<span style="font-size: 9px; font-weight: 700; background: #e0e7ff; color: #3730a3; padding: 1px 5px; border-radius: 3px; border: 1px solid #c7d2fe;">🏛️ ${ngo.scheme}</span>` : ''}
          ${ngo.ngoType ? `<span style="font-size: 9px; font-weight: 600; background: #f1f5f9; color: #475569; padding: 1px 5px; border-radius: 3px;">${ngo.ngoType}</span>` : ''}
        </div>
      ` : '';

      const contactInfo = (ngo.contactPhone || (ngo.website && ngo.website !== 'N/A')) ? `
        <div style="font-size: 10px; color: #475569; margin-bottom: 6px; display: flex; flex-direction: column; gap: 2px;">
          ${ngo.contactPhone ? `<span>📞 <b>${ngo.contactPhone}</b></span>` : ''}
          ${ngo.website && ngo.website !== 'N/A' ? `<span>🌐 <a href="${ngo.website.startsWith('http') ? ngo.website : 'https://' + ngo.website}" target="_blank" rel="noreferrer" style="color: #2563eb; text-decoration: underline;">${ngo.website}</a></span>` : ''}
        </div>
      ` : '';

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 260px; max-width: 290px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <span style="font-size: 9px; font-weight: 800; color: #1e3a8a; background: #dbeafe; padding: 2px 5px; border-radius: 3px; text-transform: uppercase;">${ngo.regNumber || ngo.id}</span>
            <span style="font-size: 10px; font-weight: 700; color: #64748b;">📍 ${ngo.district || 'Maharashtra'}</span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 3px 0 2px; line-height: 1.3;">${ngo.name}</div>
          ${verificationBadge}
          ${schemeBadges}
          <div style="font-size: 11px; color: #475569; margin-bottom: 5px; line-height: 1.35;">${ngo.address}</div>
          ${contactInfo}
          
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-bottom: 6px;">
            <span style="font-weight: 700; color: ${
              ngo.status === 'REGISTERED' ? '#059669' : ngo.status === 'FLAGGED_VIOLATION' ? '#dc2626' : '#d97706'
            }">● ${ngo.status.replace(/_/g, ' ')}</span>
            <span style="color: #475569;">Compliance: <b style="color: #0f172a;">${ngo.complianceScore || 'N/A'}%</b></span>
          </div>

          <div style="font-size: 10px; font-family: monospace; color: #0284c7; margin-bottom: 6px;">
            GPS: ${ngo.coordinates.lat.toFixed(5)}°N, ${ngo.coordinates.lng.toFixed(5)}°E
          </div>

          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background: #1a73e8;
            color: #ffffff;
            text-decoration: none;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          ">
            <span>🌐 Open in Google Maps</span>
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectNgo) onSelectNgo(ngo);
      });

      layerGroup.addLayer(marker);

      // If this NGO is actively selected or inspected, draw a 150-meter Geofence circle
      if (isSelected || activeInspection?.ngoId === ngo.id) {
        const geofenceCircle = L.circle([ngo.coordinates.lat, ngo.coordinates.lng], {
          radius: 150, // 150m strict inspection geofence
          color: '#1a73e8',
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
          weight: 2,
          dashArray: '5, 5',
        });
        geofenceCircle.bindTooltip(`150m Statutory Geofence: ${ngo.name}`, { permanent: false, direction: 'top' });
        layerGroup.addLayer(geofenceCircle);
      }
    });

    // Render Officers if requested
    if (showAllOfficers) {
      officers.forEach((officer) => {
        if (!officer?.currentLocation || typeof officer.currentLocation.lat !== 'number' || typeof officer.currentLocation.lng !== 'number') return;
        const officerMarker = L.marker([officer.currentLocation.lat, officer.currentLocation.lng], {
          icon: createOfficerIcon(officer.name, officer.status === 'ON_DUTY'),
        });

        const officerGoogleMaps = `https://www.google.com/maps?q=${officer.currentLocation.lat},${officer.currentLocation.lng}`;

        const officerPopup = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 230px;">
            <div style="font-size: 10px; font-weight: 800; color: #1e40af; text-transform: uppercase;">👮 Maharashtra Field Auditor</div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0;">${officer.name}</div>
            <div style="font-size: 11px; color: #475569;">Badge: <b>${officer.badgeNumber || 'INSP-MH-402'}</b></div>
            <div style="font-size: 11px; color: #475569;">Jurisdiction: <b>${officer.assignedDistrict || 'Maharashtra'}</b></div>
            <div style="font-size: 11px; color: #059669; margin: 4px 0;">🔋 Battery: ${officer.currentLocation.batteryLevel}% | ${officer.currentLocation.lastPingTime}</div>
            <div style="font-size: 10px; font-family: monospace; color: #0284c7; margin-bottom: 6px;">
              Live GPS: ${officer.currentLocation.lat.toFixed(5)}°N, ${officer.currentLocation.lng.toFixed(5)}°E
            </div>
            <a href="${officerGoogleMaps}" target="_blank" rel="noopener noreferrer" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              background: #1e40af;
              color: #ffffff;
              text-decoration: none;
              padding: 4px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 700;
            ">
              🌐 Track on Google Maps
            </a>
          </div>
        `;
        officerMarker.bindPopup(officerPopup);
        layerGroup.addLayer(officerMarker);
      });
    }

    // If active inspection, draw track and connection line
    if (activeInspection && activeInspection.gpsTrack && activeInspection.gpsTrack.length > 1) {
      const trackPoints: [number, number][] = activeInspection.gpsTrack
        .filter((pt) => pt && typeof pt.lat === 'number' && typeof pt.lng === 'number')
        .map((pt) => [pt.lat, pt.lng]);
      if (trackPoints.length > 1) {
        const polyline = L.polyline(trackPoints, {
          color: '#1a73e8',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6',
        });
        layerGroup.addLayer(polyline);
      }
    }

    // Center on selected NGO if set
    if (selectedNgo?.coordinates && typeof selectedNgo.coordinates.lat === 'number' && typeof selectedNgo.coordinates.lng === 'number') {
      map.flyTo([selectedNgo.coordinates.lat, selectedNgo.coordinates.lng], 14, {
        duration: 0.9,
      });
    }
  }, [ngos, officers, activeInspection, selectedNgo, onSelectNgo, showAllOfficers]);

  // Fit all markers in view
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const validNgos = ngos.filter((n) => n?.coordinates && typeof n.coordinates.lat === 'number' && typeof n.coordinates.lng === 'number');
    if (validNgos.length === 0) {
      map.flyTo(MAHARASHTRA_CENTER, MAHARASHTRA_DEFAULT_ZOOM, { duration: 0.8 });
      return;
    }

    const bounds = L.latLngBounds(validNgos.map((n) => [n.coordinates.lat, n.coordinates.lng]));
    officers.forEach((o) => {
      if (o?.currentLocation && typeof o.currentLocation.lat === 'number' && typeof o.currentLocation.lng === 'number') {
        bounds.extend([o.currentLocation.lat, o.currentLocation.lng]);
      }
    });
    map.fitBounds(bounds, { padding: [45, 45] });
    setSelectedDistrict('📍 All Maharashtra State');
  };

  // Quick jump to a Maharashtra District preset
  const handleSelectDistrict = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distName = e.target.value;
    setSelectedDistrict(distName);
    const preset = MAHARASHTRA_DISTRICT_PRESETS.find((p) => p.name === distName);
    if (preset && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(preset.center, preset.zoom, { duration: 0.9 });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100">
      <div id="interactive-gis-map-container" ref={mapContainerRef} className={`w-full ${heightClass}`} />

      {/* Top Left Toolbar: Fit Maharashtra, District Presets, Layer Switcher */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Fit Bounds Button */}
        <button
          type="button"
          onClick={handleFitAll}
          title="Fit All Maharashtra NGOs & Officers in View"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md text-slate-800 hover:text-blue-700 border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Fit Maharashtra</span>
        </button>

        {/* District Quick-Jump Dropdown */}
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={handleSelectDistrict}
            className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold border border-slate-200/90 rounded-xl py-1.5 px-3 shadow-md focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {MAHARASHTRA_DISTRICT_PRESETS.map((dist, idx) => (
              <option key={idx} value={dist.name}>
                {dist.name}
              </option>
            ))}
          </select>
        </div>

        {/* Google Maps Layer Switcher Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md text-slate-800 hover:text-blue-700 border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{TILE_CONFIGS[mapType].label}</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 text-xs animate-scale-in">
              {(Object.keys(TILE_CONFIGS) as MapTileMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setMapType(mode);
                    setIsLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors ${
                    mapType === mode ? 'font-bold text-blue-700 bg-blue-50' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{TILE_CONFIGS[mode].icon}</span>
                    <span>{TILE_CONFIGS[mode].label}</span>
                  </span>
                  {mapType === mode && <span className="text-xs text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Right: NIC GIS Survey Legend & Geofence Indicator */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 text-xs shadow-md space-y-1.5 pointer-events-auto max-w-[230px]">
        <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1.5 flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold">Maharashtra GIS</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
          <span className="text-slate-700 font-medium text-[11px]">Registered NGO ({ngos.filter(n => n.status === 'REGISTERED').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
          <span className="text-slate-700 font-medium text-[11px]">Under Inspection ({ngos.filter(n => n.status === 'UNDER_INSPECTION').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
          <span className="text-slate-700 font-medium text-[11px]">Flagged Violation ({ngos.filter(n => n.status === 'FLAGGED_VIOLATION').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
          <span className="text-slate-700 font-medium text-[11px]">Officer Live GPS ({officers.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-b-2 border-dashed border-blue-500 shrink-0"></span>
          <span className="text-slate-700 font-medium text-[11px]">150m Anti-Fraud Geofence</span>
        </div>
      </div>

      {/* Bottom Floating Pill: Active Coordinates & Google Maps Live Sync */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md text-white border border-slate-800 px-3.5 py-1.5 rounded-full text-[11px] font-mono shadow-lg flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>GOOGLE MAPS GPS ENGINE &bull; MAHARASHTRA DIVISION ({ngos.length} NGOS)</span>
      </div>
    </div>
  );
};
