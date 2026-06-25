export type SeatId = 'passenger-front' | 'rear-left' | 'rear-center' | 'rear-right';

export type LuggageSize = 'none' | 'small' | 'medium' | 'large';

export interface LuggageOption {
  size: LuggageSize;
  label: string;
  description: string;
  weightKg: number;
  volumeL: number;
  emoji: string;
}

export interface Passenger {
  name: string;
  seat: SeatId;
  luggage: LuggageSize;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  distanceKm: number;
  fuelPricePerLiter: number;
}

export interface Booking {
  id: string;
  trip: Trip;
  passengers: Passenger[];
  createdAt: string;
  userId: string;
  userName: string;
}

export interface CostBreakdown {
  fuelCostTotal: number;
  wearCostTotal: number;
  totalCost: number;
  costPerPassenger: number;
  fuelLitersNeeded: number;
}

export interface PlaceResult {
  displayName: string;
  lat: number;
  lon: number;
}

// Panda Cross 2023 specs
export const PANDA_SPECS = {
  trunkLiters: 225,
  trunkMaxWeightKg: 50,
  fuelConsumptionL100km: 5.5,
  wearCostPerKm: 0.12,
};

export const LUGGAGE_OPTIONS: LuggageOption[] = [
  {
    size: 'none',
    label: 'Nessun bagaglio',
    description: 'Solo borsa personale sotto il sedile',
    weightKg: 0,
    volumeL: 0,
    emoji: '🚫',
  },
  {
    size: 'small',
    label: 'Borsa piccola',
    description: 'Zaino o borsa da giorno — es. 40×30×20 cm',
    weightKg: 8,
    volumeL: 24,
    emoji: '🎒',
  },
  {
    size: 'medium',
    label: 'Trolley cabina',
    description: 'Trolley 55 cm — es. 55×40×20 cm',
    weightKg: 18,
    volumeL: 44,
    emoji: '🧳',
  },
  {
    size: 'large',
    label: 'Valigia grande',
    description: 'Valigia check-in — es. 75×50×25 cm',
    weightKg: 30,
    volumeL: 94,
    emoji: '🗄️',
  },
];

export const SEAT_LABELS: Record<SeatId, string> = {
  'passenger-front': 'Davanti Dx',
  'rear-left': 'Dietro Sx',
  'rear-center': 'Dietro Centro',
  'rear-right': 'Dietro Dx',
};
