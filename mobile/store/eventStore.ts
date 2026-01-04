import { create } from 'zustand';
import type { Event } from '../types';

interface EventStore {
  events: Event[];
  selectedEvent: Event | null;
  selectedDate: string | null;
  isLoading: boolean;
  setEvents: (events: Event[]) => void;
  setSelectedEvent: (event: Event | null) => void;
  setSelectedDate: (date: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  getEventsByDate: (date: string) => Event[];
  getEventsByMonth: (year: number, month: number) => Event[];
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  selectedEvent: null,
  selectedDate: null,
  isLoading: false,

  setEvents: (events) => set({ events }),

  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setLoading: (isLoading) => set({ isLoading }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  getEventsByDate: (date) => {
    const { events } = get();
    return events.filter((event) => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === date;
    });
  },

  getEventsByMonth: (year, month) => {
    const { events } = get();
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  },
}));
