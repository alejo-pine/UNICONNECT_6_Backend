import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

class EventDatabaseHandler {
  private static instance: EventDatabaseHandler;
  private readonly client: SupabaseClient;

  private constructor() {
    this.client = supabase;
  }

  public static getInstance(): EventDatabaseHandler {
    if (!EventDatabaseHandler.instance) {
      EventDatabaseHandler.instance = new EventDatabaseHandler();
    }

    return EventDatabaseHandler.instance;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }
}

export const eventDatabaseHandler = EventDatabaseHandler.getInstance();
