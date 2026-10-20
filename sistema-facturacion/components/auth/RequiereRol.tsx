// components/auth/RequiereRol.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cargarSesion, tienePermiso } from '../../controllers/authController';
import { RolUsuario } from '../../models/agrolactec';

interface Props {
  rolesPermitidos: RolUsuario[];
  children: React.ReactNode;
}

export default function RequiereRol({ rolesPermitidos, children }: Props) {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    const sesion = cargarSesion();
    if (!tienePermiso(sesion, rolesPermitidos)) {
      router.push('/login');
      setAutorizado(false);
    } else {
      setAutorizado(true);
    }
  }, [rolesPermitidos, router]);

  if (autorizado === null) return <div>Cargando...</div>;
  if (!autorizado) return null;
  return <>{children}</>;
}