import FooterButtons from '@/components/footer-buttons';
import HeadTitle from '@/components/head-title';
import { SESSION_KEYS } from '@/constants';
import useSessionStorage from '@/hooks/use-session-storage';
import { Check } from 'lucide-react';
import { useCallback } from 'react';

interface Location {
  id: string;
  name: string;
  address: string;
}

const LOCATIONS: readonly Location[] = [
  {
    id: '1',
    name: 'Leaside Location (Pick-up and Delivery)',
    address: '40 Laird Drive, Toronto, ON, M4G 3T2'
  },
  {
    id: '2',
    name: 'Downtown Location (Pick-up Only)',
    address: '14 Isabella Street, Toronto, ON, M4Y 1N1'
  }
] as const;

const DEFAULT_LOCATION = '1';

function LocationComponent() {
  const [locationData, setLocationData] = useSessionStorage<string>(
    SESSION_KEYS.LOCATION_KEY,
    DEFAULT_LOCATION
  );

  const selectedLocation = locationData || DEFAULT_LOCATION;

  const handleLocationSelect = useCallback((locationId: string) => {
    setLocationData(locationId);
  }, [setLocationData]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, locationId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLocationSelect(locationId);
    }
  }, [handleLocationSelect]);

  return (
    <div className="space-y-4">
      <HeadTitle
        title="Select Preferred Location"
        description="Select your nearest pick-up or delivery point. If unsure, select Leaside location."
      />

      <div className="space-y-4 px-1" role="radiogroup" aria-label="Preferred location selection">
        {LOCATIONS.map((location) => {
          const selected = selectedLocation === location.id;
          return (
            <div
              key={location.id}
              role="radio"
              aria-checked={selected}
              aria-label={`${location.name}, ${location.address}`}
              tabIndex={0}
              onClick={() => handleLocationSelect(location.id)}
              onKeyDown={(e) => handleKeyDown(e, location.id)}
              className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all focus:outline-none ${selected
                ? 'border-theme-green bg-theme-green/5'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio Button Indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-colors ${selected
                    ? 'border-theme-green bg-white'
                    : 'border-gray-300 bg-white'
                    }`}
                  aria-hidden="true"
                >
                  {selected && (
                    <div className="w-3 h-3 rounded-full bg-theme-green"></div>
                  )}
                </div>

                {/* Location Details */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {location.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {location.address}
                  </p>
                </div>

                {/* Check Mark */}
                {selected && (
                  <div
                    className="absolute h-full top-0 right-2 flex items-center justify-center px-4"
                    aria-hidden="true"
                  >
                    <div className="w-8 h-8 bg-theme-green rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <FooterButtons nextButtonPath="/account" />
    </div>
  );
}

export default LocationComponent;