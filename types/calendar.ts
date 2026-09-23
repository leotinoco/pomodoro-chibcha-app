/** Evento de Google Calendar tal como lo entrega /api/calendar al navegador. */
export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  /** Descripción del evento: texto plano o HTML (se renderiza saneada). */
  description?: string;
  location?: string;
  /** Enlace al evento en Google Calendar. */
  htmlLink?: string;
  /** Enlace de videollamada (Meet, Zoom, Teams…). */
  meetLink?: string;
  conferenceName?: string;
  phone?: { uri: string; label?: string; pin?: string };
  attachments?: { title?: string; fileUrl: string }[];
}
