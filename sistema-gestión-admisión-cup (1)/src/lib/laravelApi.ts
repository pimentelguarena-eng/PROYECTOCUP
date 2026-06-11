/**
 * SDK de Conexión de API - Sistema de Admisión CUP (FICCT - UAGRM)
 * 
 * Este cliente gestiona la comunicación HTTP REST con el backend desarrollado en PHP Laravel
 * y su respectivo motor PostgreSQL, realizando un fallback transparente hacia localStorage
 * para posibilitar el testeo interactivo fluido dentro del Sandbox de Google AI Studio.
 */

import { DatabaseState } from '../dataStore';
import { Usuario } from '../types';

const LARAVEL_API_BASE = (import.meta as any).env?.VITE_LARAVEL_API_URL || 'http://localhost:8000/api/v1';

export class LaravelApiClient {
  private static token: string | null = localStorage.getItem('cup_auth_token');

  /**
   * Configura el Token Bearer tras un inicio de sesión exitoso en el Backend
   */
  public static setToken(token: string) {
    this.token = token;
    localStorage.setItem('cup_auth_token', token);
  }

  /**
   * Obtiene las cabeceras HTTP necesarias para las peticiones seguras de Laravel Sanctum
   */
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Petición Genérica POST de Login hacia Laravel
   */
  public static async loginWithLaravel(loginEmail: string, password: string): Promise<any> {
    try {
      console.log(`[Laravel Integration] Intentando autenticación PostgreSQL para: ${loginEmail}`);
      const response = await fetch(`${LARAVEL_API_BASE}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ loginEmail, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas en el servidor Laravel.');
      }

      const data = await response.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e) {
      console.warn('[Laravel Fallback Active] No se pudo establecer conexión con PHP Laravel o PostgreSQL en local. Usando base de datos reactiva cliente simulada.');
      return null;
    }
  }

  /**
   * Subir un comprobante financiero de postulación al Back-End
   */
  public static async uploadPaymentVoucher(monto: number, factura: string, url: string): Promise<any> {
    try {
      const response = await fetch(`${LARAVEL_API_BASE}/estudiante/pago/upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          monto,
          nro_factura: factura,
          comprobante_url: url
        }),
      });
      return await response.json();
    } catch (e) {
      console.info('[Laravel Fallback] Guardando boleta en el datastore local.');
      return null;
    }
  }

  /**
   * Cargar notas de estudiante por el docente
   */
  public static async saveStudentGrades(estudianteId: string, materiaId: number, p1: number, p2: number, ef: number): Promise<any> {
    try {
      const response = await fetch(`${LARAVEL_API_BASE}/docente/grades/save`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          estudiante_id: estudianteId,
          materia_id: materiaId,
          p1,
          p2,
          ef
        }),
      });
      return await response.json();
    } catch (e) {
      console.info('[Laravel Fallback] Actualizando notas en base de datos cliente persistida.');
      return null;
    }
  }

  /**
   * Actualizar el cupo máximo de una carrera (Solo Administradores)
   */
  public static async updateCareerQuota(carreraId: number, cupoMaximo: number): Promise<any> {
    try {
      const response = await fetch(`${LARAVEL_API_BASE}/admin/carreras/${carreraId}/quota`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          cupo_maximo: cupoMaximo
        }),
      });
      return await response.json();
    } catch (e) {
      console.info('[Laravel Fallback] Actualizando cupo en el datastore local.');
      return null;
    }
  }

  /**
   * Cierre oficial del periodo por un Administrador Central
   */
  public static async triggerOfficialAdmissionsClose(): Promise<any> {
    try {
      const response = await fetch(`${LARAVEL_API_BASE}/admin/admission/close-period`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (e) {
      console.info('[Laravel Fallback] Ejecutando orden de asignación de cupos recursiva en el cliente.');
      return null;
    }
  }

  /**
   * Obtener bitácora de auditoría (Solo Administradores)
   */
  public static async getAuditLogs(): Promise<any> {
    try {
      const response = await fetch(`${LARAVEL_API_BASE}/admin/logs`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (e) {
      console.info('[Laravel Fallback] Consultando bitácora local.');
      return null;
    }
  }
}
