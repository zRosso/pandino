import type { Booking, CostBreakdown, LuggageSize, Passenger, PlaceResult, Trip } from './types';
import { LUGGAGE_OPTIONS, PANDA_SPECS } from './types';
import { supabase } from './supabase';

export function calculateCosts(trip: Trip, passengers: Passenger[]): CostBreakdown {
  const { distanceKm, fuelPricePerLiter } = trip;
  const fuelLitersNeeded = (distanceKm * PANDA_SPECS.fuelConsumptionL100km) / 100;
  const fuelCostTotal = fuelLitersNeeded * fuelPricePerLiter;
  const wearCostTotal = distanceKm * PANDA_SPECS.wearCostPerKm;
  const totalCost = fuelCostTotal + wearCostTotal;
  const numPassengers = passengers.length;
  const costPerPassenger = numPassengers > 0 ? totalCost / numPassengers : 0;
  return { fuelCostTotal, wearCostTotal, totalCost, costPerPassenger, fuelLitersNeeded };
}

export function getLuggageForSize(size: LuggageSize) {
  return LUGGAGE_OPTIONS.find((o) => o.size === size)!;
}

export function calcTrunkUsage(passengers: Passenger[]) {
  let usedL = 0;
  let usedKg = 0;
  passengers.forEach((p) => {
    const opt = getLuggageForSize(p.luggage);
    usedL += opt.volumeL;
    usedKg += opt.weightKg;
  });
  return { usedL, usedKg };
}

export function trunkPercentage(usedL: number) {
  return Math.min(100, Math.round((usedL / PANDA_SPECS.trunkLiters) * 100));
}

// Calcola distanza stradale tra due coordinate via OSRM (gratuito, no API key)
export async function getRouteDistanceKm(from: PlaceResult, to: PlaceResult): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Errore nel calcolo del percorso');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Percorso non trovato');
  return Math.round(data.routes[0].distance / 1000);
}

// --- Auth helpers ---

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// --- Supabase DB functions ---

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id ?? '',
    userName: row.user_name ?? 'Sconosciuto',
    trip: {
      id: row.id,
      from: row.from_location,
      to: row.to_location,
      date: row.date,
      time: row.time,
      distanceKm: row.distance_km,
      fuelPricePerLiter: row.fuel_price_per_liter,
    },
    passengers: row.passengers as Passenger[],
  }));
}

export async function insertBooking(booking: Booking): Promise<void> {
  const { error } = await supabase.from('bookings').insert({
    id: booking.id,
    from_location: booking.trip.from,
    to_location: booking.trip.to,
    date: booking.trip.date,
    time: booking.trip.time,
    distance_km: booking.trip.distanceKm,
    fuel_price_per_liter: booking.trip.fuelPricePerLiter,
    passengers: booking.passengers,
    created_at: booking.createdAt,
    user_id: booking.userId,
    user_name: booking.userName,
  });
  if (error) throw error;
}

export async function removeBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
}

export function formatEuro(val: number) {
  return val.toFixed(2).replace('.', ',') + ' €';
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
