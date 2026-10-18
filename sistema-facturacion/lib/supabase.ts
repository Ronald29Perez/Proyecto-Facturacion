// ============================================================================
// CONEXIÓN CENTRALIZADA CON SUPABASE
// Ubicación: lib/supabase.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Lectura de las variables de entorno configuradas en .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Atención: Faltan las variables de entorno en el archivo .env.local');
}

// Instancia única del cliente de Supabase para todo el proyecto
export const supabase = createClient(supabaseUrl, supabaseAnonKey);