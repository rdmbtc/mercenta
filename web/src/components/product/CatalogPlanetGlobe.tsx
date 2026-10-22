'use client';
import {Planet} from '@/components/panelui/planet';

export function CatalogPlanetGlobe({
  selectedRegion,
  onSelectRegion,
  ru,
}: {
  selectedRegion: string;
  onSelectRegion: (r: string) => void;
  ru: boolean;
}) {
  return (
    <div className="cf-planet-globe-wrapper my-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/30 border border-white/10 text-slate-200">
      <div className="text-xs font-semibold text-sky-400 mb-2 flex items-center gap-2">
        <span>{ru ? 'ИНТЕРАКТИВНЫЙ РЕГИОНАЛЬНЫЙ ГЛОБУС' : 'INTERACTIVE REGIONAL REDEMPTION GLOBE'}</span>
      </div>
      <div className="w-full max-w-[260px] aspect-square flex items-center justify-center">
        <Planet defaultRotation={[20, 15]} autoRotate={0.4} interactive>
          <Planet.Globe aria-label="Regional redemption globe">
            <Planet.Marker
              lat={38}
              lng={-97}
              label={ru ? 'США · US' : 'North America · US'}
              color="info"
              selected={selectedRegion === 'US'}
              pulse={selectedRegion === 'US'}
              onClick={() => onSelectRegion(selectedRegion === 'US' ? 'all' : 'US')}
            />
            <Planet.Marker
              lat={48.8}
              lng={2.3}
              label={ru ? 'Европа · EU' : 'Europe · EU'}
              color="primary"
              selected={selectedRegion === 'EU' || selectedRegion === 'DE'}
              pulse={selectedRegion === 'EU'}
              onClick={() => onSelectRegion(selectedRegion === 'EU' ? 'all' : 'EU')}
            />
            <Planet.Marker
              lat={39.9}
              lng={32.8}
              label={ru ? 'Турция · TR' : 'Turkey · TR'}
              color="warning"
              selected={selectedRegion === 'TR'}
              pulse={selectedRegion === 'TR'}
              onClick={() => onSelectRegion(selectedRegion === 'TR' ? 'all' : 'TR')}
            />
            <Planet.Marker
              lat={35.6}
              lng={139.6}
              label={ru ? 'Азия / Global' : 'Asia-Pacific / Global'}
              color="success"
              selected={selectedRegion === 'GLOBAL' || selectedRegion === 'JP'}
              pulse={selectedRegion === 'GLOBAL'}
              onClick={() => onSelectRegion(selectedRegion === 'GLOBAL' ? 'all' : 'GLOBAL')}
            />
          </Planet.Globe>
        </Planet>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 text-center">
        {ru
          ? 'Поверните глобус мышью или выберите маркер региона'
          : 'Drag the 3D globe or select any regional marker to filter'}
      </p>
    </div>
  );
}
