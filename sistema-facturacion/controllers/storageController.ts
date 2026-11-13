import { supabase } from '../lib/supabase';

/**
 * Sube una imagen al bucket 'productos' y devuelve la URL pública.
 */
export async function subirImagenProducto(file: File, itemCode: string): Promise<string | null> {
  try {
    // 1. Generar un nombre único para evitar colisiones
    const fileExt = file.name.split('.').pop();
    const fileName = `${itemCode}-${Date.now()}.${fileExt}`;
    const filePath = fileName; // Se guarda en la raíz del bucket

    // 2. Subir el archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError.message);
      return null;
    }

    // 3. Obtener la URL pública
    const { data } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error en subirImagenProducto:', error);
    return null;
  }
}