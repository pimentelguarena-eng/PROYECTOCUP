import React, { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase, getEnforcedAdmissions, logAction, DatabaseState } from './dataStore';
import { Usuario, EstudianteDetalle, Pago, Nota, Asistencia, Rol, Carrera, Materia, Grupo } from './types';
import { LaravelApiClient } from './lib/laravelApi';
import AdminPanel from './components/AdminPanel';
import DocentePanel from './components/DocentePanel';
import EstudiantePanel from './components/EstudiantePanel';
import ReportPanel from './components/ReportPanel';
import AuthScreen from './components/AuthScreen';
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  BarChart,
  History,
  ShieldCheck,
  RotateCcw,
  Info,
  Layers,
  CalendarDays,
  Menu,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<DatabaseState>(() => loadDatabase());

  // Real Logged-in session state with LocalStorage persistence
  const [sessionUser, setSessionUser] = useState<Usuario | null>(() => {
    try {
      const stored = localStorage.getItem('cup_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'docente' | 'estudiante' | 'reportes' | 'bitacora'>('dashboard');

  // Custom visual dialog/modal states
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    showCancel: boolean;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const triggerAlert = (message: string, title = 'Notificación Académica') => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => setDialog(null),
      showCancel: false,
      confirmText: 'Aceptar'
    });
  };

  const triggerConfirm = (message: string, onConfirm: () => void, title = 'Confirmar Acción') => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setDialog(null);
      },
      showCancel: true,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  };

  // Handle saving state whenever DB modifications occur
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Sync session user
  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem('cup_session_user', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('cup_session_user');
    }
  }, [sessionUser]);

  const activeUser = sessionUser || db.usuarios[0];

  // Handle new registrations of students / teachers / admins
  const handleRegisterUser = (newUser: Usuario, customDetails: any) => {
    setDb(prev => {
      const updatedUsers = [...prev.usuarios, newUser];
      let updatedEstudiantes = [...prev.estudiantes];
      let updatedDocentes = [...prev.docentes];
      let updatedPayments = [...prev.pagos];
      let updatedGroups = prev.grupos.map(g => ({ ...g }));

      if (newUser.rol === Rol.Estudiante && customDetails?.studentDetail) {
        // Add student details
        updatedEstudiantes.push(customDetails.studentDetail);

        // Add payment entry
        if (customDetails.initialPayment) {
          updatedPayments.push(customDetails.initialPayment);
        }

        // Auto-enroll the new student in standard courses/groups for all 4 subjects matching their shift
        const preferredTurno = customDetails.studentDetail.turno_preferido;
        const shiftPrefix = preferredTurno === 'Mañana' ? 'M' : preferredTurno === 'Tarde' ? 'T' : 'N';
        
        prev.materias.forEach(materia => {
          // Find existing groups for this matter and this shift
          const shiftGroups = updatedGroups.filter(g =>
            g.materia_id === materia.id &&
            g.turno === preferredTurno
          ).sort((a, b) => {
            const numA = parseInt(a.sigla.replace(/[^\d]/g, '') || '0');
            const numB = parseInt(b.sigla.replace(/[^\d]/g, '') || '0');
            return numA - numB;
          });

          let targetGroup = shiftGroups.find(g => g.estudiantes_ids.length < g.cupo_maximo);

          if (targetGroup) {
            updatedGroups = updatedGroups.map(g => {
              if (g.id === targetGroup!.id) {
                return { ...g, estudiantes_ids: [...g.estudiantes_ids, newUser.id] };
              }
              return g;
            });
          } else {
            // Create new group if none available
            const nextNum = shiftGroups.length + 1;
            const newGroupId = `g-${materia.id}-${shiftPrefix.toLowerCase()}-${nextNum}-${Date.now()}`;
            
            // Fixed mappings per subject as requested
            const subjectLocations: Record<number, { mod: string, aula: string }> = {
              1: { mod: '236', aula: '12' }, // Computación
              2: { mod: '225', aula: '17' }, // Matemáticas
              3: { mod: '227', aula: '24' }, // Inglés
              4: { mod: '228', aula: '31' }  // Física
            };
            const loc = subjectLocations[materia.id] || { mod: '236', aula: '10' };
            
            const slots = {
              'Mañana': ['07:00', '08:00', '09:00', '10:00'],
              'Tarde': ['13:00', '14:00', '15:00', '16:00'],
              'Noche': ['18:00', '19:00', '20:00', '21:00'],
            };
            const horaInicio = slots[preferredTurno][(materia.id - 1) % 4];
            const horaFin = `${(parseInt(horaInicio.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

            const newGroup: Grupo = {
              id: newGroupId,
              sigla: `Grupo-${shiftPrefix}${nextNum}`,
              materia_id: materia.id,
              docente_id: null,
              turno: preferredTurno,
              modulo: loc.mod,
              aula: loc.aula,
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              cupo_maximo: 70,
              estudiantes_ids: [newUser.id]
            };
            updatedGroups.push(newGroup);
          }
        });
      } else if (newUser.rol === Rol.Docente && customDetails?.docenteDetail) {
        updatedDocentes.push(customDetails.docenteDetail);
      }

      const freshDb = {
        ...prev,
        usuarios: updatedUsers,
        estudiantes: updatedEstudiantes,
        docentes: updatedDocentes,
        pagos: updatedPayments,
        grupos: updatedGroups
      };

      return logAction(
        freshDb,
        newUser.id,
        newUser.nombre_completo,
        `Se registró nueva cuenta de usuario en el sistema [Rol: ${newUser.rol}]`,
        'MÓDULO SEGURIDAD / REGISTRO'
      );
    });

    // Auto login
    setSessionUser(newUser);

    // Default view routing
    if (newUser.rol === Rol.Estudiante) {
      setActiveTab('estudiante');
    } else if (newUser.rol === Rol.Docente) {
      setActiveTab('docente');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Helper to trigger bitacora security logs
  const handleLogAction = (action: string, modulo: string) => {
    setDb(prev => logAction(prev, activeUser.id, activeUser.nombre_completo, action, modulo));
  };



  // Recalculated admission list variables with career allocation priorities
  const admissionResults = getEnforcedAdmissions(db);

  // Business Action: Student Payment Approved by Admin
  const handleApprovePayment = (pagoId: string) => {
    setDb(prev => {
      const updatedPayments = prev.pagos.map(p => {
        if (p.id === pagoId) {
          const matchEst = prev.estudiantes.find(e => e.usuario_id === p.estudiante_id);
          const matchUser = prev.usuarios.find(u => u.id === p.estudiante_id);

          return {
            ...p,
            estado_pago: 'Pagado' as const,
            fecha_pago: new Date().toISOString(),
            nro_factura: p.nro_factura || `F-2026-${Math.floor(1000 + Math.random() * 9000)}`
          };
        }
        return p;
      });

      // Update student's academic state from 'Postulante' to 'Inscrito'
      const matchPay = prev.pagos.find(p => p.id === pagoId);
      const updatedEstudiantes = prev.estudiantes.map(e => {
        if (e.usuario_id === matchPay?.estudiante_id) {
          return {
            ...e,
            estado_cup: 'Inscrito' as const
          };
        }
        return e;
      });

      const updatedState = {
        ...prev,
        pagos: updatedPayments,
        estudiantes: updatedEstudiantes
      };

      const estUser = prev.usuarios.find(u => u.id === matchPay?.estudiante_id);
      return logAction(
        updatedState,
        activeUser.id,
        activeUser.nombre_completo,
        `Se aprobó pago de inscripción arancel de 700 Bs. para postulante: ${estUser?.nombre_completo || 'Postulante'}`,
        'MÓDULO PAGOS'
      );
    });
  };

  // Business Action: Student uploads payment receipt proposal
  const handleStudentUploadVoucher = (reference: string) => {
    setDb(prev => {
      // Find or create payment node
      const updatedPayments = [...prev.pagos];
      const index = updatedPayments.findIndex(p => p.estudiante_id === activeUser.id);

      const newPago: Pago = {
        id: index >= 0 ? updatedPayments[index].id : `p-${Date.now()}`,
        estudiante_id: activeUser.id,
        monto: 700.00,
        nro_factura: reference,
        estado_pago: 'Pendiente' as const, // Awaiting admin confirmation
        created_at: new Date().toISOString()
      };

      if (index >= 0) {
        updatedPayments[index] = newPago;
      } else {
        updatedPayments.push(newPago);
      }

      const updatedState = {
        ...prev,
        pagos: updatedPayments
      };

      return logAction(
        updatedState,
        activeUser.id,
        activeUser.nombre_completo,
        `Estudiante subió comprobante de pago de arancel de inscripción. Referencia: ${reference}`,
        'MÓDULO PAGOS'
      );
    });
    triggerAlert('Comprobante enviado con éxito. El Administrador verificará su factura en el panel.', 'Envío de Pago');
  };

  // Business Action: Student uploads missing High School Degree
  const handleStudentUploadDocs = () => {
    setDb(prev => {
      const updatedEstudiantes = prev.estudiantes.map(e => {
        if (e.usuario_id === activeUser.id) {
          return {
            ...e,
            titulo_bachiller: true
          };
        }
        return e;
      });

      const updatedState = { ...prev, estudiantes: updatedEstudiantes };
      return logAction(
        updatedState,
        activeUser.id,
        activeUser.nombre_completo,
        `Estudiante presentó Título de Bachiller requerido para la admisión preuniversitaria.`,
        'MÓDULO ADMISIÓN'
      );
    });
    triggerAlert('Título de Bachiller cargado y validado en el del sistema CUP.', 'Requisito de Admisión');
  };

  // Business Action: Student updates password
  const handleStudentUpdatePassword = (newPass: string) => {
    setDb(prev => {
      const updatedUsers = prev.usuarios.map(u => {
        if (u.id === activeUser.id) {
          return {
            ...u,
            password: newPass
          };
        }
        return u;
      });

      const updatedState = { ...prev, usuarios: updatedUsers };
      setSessionUser(prevUser => prevUser ? { ...prevUser, password: newPass } : null);

      return logAction(
        updatedState,
        activeUser.id,
        activeUser.nombre_completo,
        `El postulante ${activeUser.nombre_completo} cambió su contraseña de acceso.`,
        'MÓDULO SEGURIDAD'
      );
    });
  };

  // CRUD: Admin registers a student
  const handleAddStudent = (newUser: Usuario, newDetail: EstudianteDetalle) => {
    setDb(prev => {
      // Add user
      const updatedUsers = [...prev.usuarios, newUser];
      // Add detail
      const updatedEstudiantes = [...prev.estudiantes, newDetail];
      // Add initial pending payment
      const newPago: Pago = {
        id: `p-${Date.now()}`,
        estudiante_id: newUser.id,
        monto: 700.00,
        nro_factura: '',
        estado_pago: 'Pendiente' as const,
        created_at: new Date().toISOString()
      };
      const updatedPayments = [...prev.pagos, newPago];

      // Dynamic Group Assignment Logic (Rule: Max 70 students per group, auto-create N groups)
      let currentGroups = [...prev.grupos];
      const shiftPrefix = newDetail.turno_preferido === 'Mañana' ? 'M' :
        newDetail.turno_preferido === 'Tarde' ? 'T' : 'N';

      prev.materias.forEach(materia => {
        // Find existing groups for this matter and this shift
        const shiftGroups = currentGroups.filter(g =>
          g.materia_id === materia.id &&
          g.turno === newDetail.turno_preferido
        ).sort((a, b) => {
          // Sort by number in sigla to find the last one (e.g. M1, M2...)
          const numA = parseInt(a.sigla.replace(/[^\d]/g, '') || '0');
          const numB = parseInt(b.sigla.replace(/[^\d]/g, '') || '0');
          return numA - numB;
        });

        let targetGroup = shiftGroups.find(g => g.estudiantes_ids.length < 70);

        if (targetGroup) {
          // Add student to the group that has space
          currentGroups = currentGroups.map(g => {
            if (g.id === targetGroup!.id) {
              return {
                ...g,
                estudiantes_ids: [...g.estudiantes_ids, newUser.id]
              };
            }
            return g;
          });
        } else {
          // All existing groups full or none exist for this shift: Create a new one!
          const nextNum = shiftGroups.length + 1;
          const newGroupId = `g-${materia.id}-${shiftPrefix.toLowerCase()}-${nextNum}-${Date.now()}`;
          
          // Fixed mappings per subject as requested
          const subjectLocations: Record<number, { mod: string, aula: string }> = {
            1: { mod: '236', aula: '12' }, // Computación
            2: { mod: '225', aula: '17' }, // Matemáticas
            3: { mod: '227', aula: '24' }, // Inglés
            4: { mod: '228', aula: '31' }  // Física
          };
          const loc = subjectLocations[materia.id] || { mod: '236', aula: '10' };
          
          const slots = {
            'Mañana': ['07:00', '08:00', '09:00', '10:00'],
            'Tarde': ['13:00', '14:00', '15:00', '16:00'],
            'Noche': ['18:00', '19:00', '20:00', '21:00'],
          };
          const horaInicio = slots[newDetail.turno_preferido][(materia.id - 1) % 4];
          const horaFin = `${(parseInt(horaInicio.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

          const newGroup: Grupo = {
            id: newGroupId,
            sigla: `Grupo-${shiftPrefix}${nextNum}`, // e.g. Grupo-M1, Grupo-T2
            materia_id: materia.id,
            docente_id: null, // Initially unassigned
            turno: newDetail.turno_preferido,
            modulo: loc.mod,
            aula: loc.aula,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            cupo_maximo: 70,
            estudiantes_ids: [newUser.id]
          };
          currentGroups.push(newGroup);
        }
      });

      return {
        ...prev,
        usuarios: updatedUsers,
        estudiantes: updatedEstudiantes,
        pagos: updatedPayments,
        grupos: currentGroups
      };
    });
  };

  // CRUD: Admin edits student parameters
  const handleEditStudent = (studentId: string, updatedUser: Partial<Usuario>, updatedDetail: Partial<EstudianteDetalle>) => {
    setDb(prev => {
      const updatedUsers = prev.usuarios.map(u => {
        if (u.id === studentId) {
          return { ...u, ...updatedUser };
        }
        return u;
      });

      const updatedEstudiantes = prev.estudiantes.map(e => {
        if (e.usuario_id === studentId) {
          return { ...e, ...updatedDetail };
        }
        return e;
      });

      return {
        ...prev,
        usuarios: updatedUsers,
        estudiantes: updatedEstudiantes
      };
    });
  };

  // CRUD: Admin deletes a student
  const handleDeleteStudent = (studentId: string) => {
    triggerConfirm(
      '¿Está completamente seguro de eliminar este postulante del sistema CUP de forma permanente?',
      () => {
        setDb(prev => {
          const updatedUsers = prev.usuarios.filter(u => u.id !== studentId);
          const updatedEstudiantes = prev.estudiantes.filter(e => e.usuario_id !== studentId);
          const updatedPayments = prev.pagos.filter(p => p.estudiante_id !== studentId);
          const updatedGrades = prev.notas.filter(g => g.estudiante_id !== studentId);
          const updatedGroups = prev.grupos.map(g => ({
            ...g,
            estudiantes_ids: g.estudiantes_ids.filter(id => id !== studentId)
          }));

          const deletedUser = prev.usuarios.find(u => u.id === studentId);

          const updatedState = {
            ...prev,
            usuarios: updatedUsers,
            estudiantes: updatedEstudiantes,
            pagos: updatedPayments,
            notas: updatedGrades,
            grupos: updatedGroups
          };

          return logAction(
            updatedState,
            activeUser.id,
            activeUser.nombre_completo,
            `Se eliminó registro permanente de postulante: ${deletedUser?.nombre_completo || 'Postulante'}`,
            'MÓDULO ADMISIÓN'
          );
        });
      },
      'Eliminar Postulante'
    );
  };

  // Batch imports
  const handleBatchImport = (newStudents: Array<{ user: Usuario; detail: EstudianteDetalle; payment: Pago }>) => {
    setDb(prev => {
      let bUsers = [...prev.usuarios];
      let bDetails = [...prev.estudiantes];
      let bPayments = [...prev.pagos];
      let bGroups = [...prev.grupos];

      newStudents.forEach(item => {
        bUsers.push(item.user);
        bDetails.push(item.detail);
        bPayments.push(item.payment);

        const shiftPrefix = item.detail.turno_preferido === 'Mañana' ? 'M' :
          item.detail.turno_preferido === 'Tarde' ? 'T' : 'N';

        prev.materias.forEach(materia => {
          // Find existing groups for this matter and this shift within the currently accumulating batch groups
          const shiftGroups = bGroups.filter(g =>
            g.materia_id === materia.id &&
            g.turno === item.detail.turno_preferido
          ).sort((a, b) => {
            const numA = parseInt(a.sigla.replace(/[^\d]/g, '') || '0');
            const numB = parseInt(b.sigla.replace(/[^\d]/g, '') || '0');
            return numA - numB;
          });

          let targetGroup = shiftGroups.find(g => g.estudiantes_ids.length < 70);

          if (targetGroup) {
            bGroups = bGroups.map(g => {
              if (g.id === targetGroup!.id) {
                return {
                  ...g,
                  estudiantes_ids: [...g.estudiantes_ids, item.user.id]
                };
              }
              return g;
            });
          } else {
            const nextNum = shiftGroups.length + 1;
            const newGroupId = `g-${materia.id}-${shiftPrefix.toLowerCase()}-${nextNum}-${Date.now()}-${Math.random()}`;
            
            // Fixed mappings per subject as requested
            const subjectLocations: Record<number, { mod: string, aula: string }> = {
              1: { mod: '236', aula: '12' }, // Computación
              2: { mod: '225', aula: '17' }, // Matemáticas
              3: { mod: '227', aula: '24' }, // Inglés
              4: { mod: '228', aula: '31' }  // Física
            };
            const loc = subjectLocations[materia.id] || { mod: '236', aula: '10' };
            
            const slots = {
              'Mañana': ['07:00', '08:00', '09:00', '10:00'],
              'Tarde': ['13:00', '14:00', '15:00', '16:00'],
              'Noche': ['18:00', '19:00', '20:00', '21:00'],
            };
            const horaInicio = slots[item.detail.turno_preferido][(materia.id - 1) % 4];
            const horaFin = `${(parseInt(horaInicio.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

            const newGroup: Grupo = {
              id: newGroupId,
              sigla: `Grupo-${shiftPrefix}${nextNum}`,
              materia_id: materia.id,
              docente_id: null,
              turno: item.detail.turno_preferido,
              modulo: loc.mod,
              aula: loc.aula,
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              cupo_maximo: 70,
              estudiantes_ids: [item.user.id]
            };
            bGroups.push(newGroup);
          }
        });
      });

      return {
        ...prev,
        usuarios: bUsers,
        estudiantes: bDetails,
        pagos: bPayments,
        grupos: bGroups
      };
    });
  };

  // Reset database helper
  const handleResetDatabase = () => {
    triggerConfirm(
      '¿Restaurar la base de datos a los valores iniciales semilla de demostración académica?',
      () => {
        localStorage.clear();
        const freshDb = loadDatabase();
        setDb(freshDb);
        triggerAlert('La base de datos del CUP ha sido restablecida exitosamente.', 'Base de Datos');
      },
      'Restaurar Base de Datos'
    );
  };

  // Business Action: Teacher saves student grades
  const handleSaveStudentGrade = async (studentId: string, materiaId: number, p1: number, p2: number, ef: number) => {
    // Attempt API save
    const response = await LaravelApiClient.saveStudentGrades(studentId, materiaId, p1, p2, ef);
    
    // Update local state (Fallback or Sync)
    setDb(prev => {
      const finalSubjectAvg = parseFloat((((p1 + p2 + ef) / 3) * 10).toFixed(2));
      const updatedGrades = [...prev.notas];
      const index = updatedGrades.findIndex(g => g.estudiante_id === studentId && g.materia_id === materiaId);
      
      const newGradeNode: Nota = {
        id: index >= 0 ? updatedGrades[index].id : `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        estudiante_id: studentId,
        materia_id: materiaId,
        nota_parcial_1: p1,
        nota_parcial_2: p2,
        nota_examen_final: ef,
        nota_final_materia: finalSubjectAvg
      };

      if (index >= 0) {
        updatedGrades[index] = newGradeNode;
      } else {
        updatedGrades.push(newGradeNode);
      }

      const studentUser = prev.usuarios.find(u => u.id === studentId);
      const mat = prev.materias.find(m => m.id === materiaId);

      const updatedState = { ...prev, notas: updatedGrades };
      return logAction(
        updatedState,
        activeUser.id,
        activeUser.nombre_completo,
        `Se registraron calificaciones para ${studentUser?.nombre_completo || 'Estudiante'} en ${mat?.nombre || 'Materia'}: [P1: ${p1}, P2: ${p2}, EF: ${ef}]`,
        'MÓDULO EVALUACIÓN'
      );
    });

    if (response && response.success) {
      triggerAlert('Calificaciones sincronizadas con éxito en el servidor PostgreSQL.', 'Registro Exitoso');
    }
  };

  if (sessionUser === null) {
    return (
      <AuthScreen
        usuarios={db.usuarios}
        estudiantes={db.estudiantes}
        carreras={db.carreras}
        periodoActivo={db.periodoActivo || '2026/1'}
        onLogin={(usr) => {
          setSessionUser(usr);
          setDb(prev => logAction(
            prev,
            usr.id,
            usr.nombre_completo,
            `El usuario ${usr.nombre_completo} [Rol: ${usr.rol}] inició sesión en el sistema.`,
            'SISTEMA / SEGURIDAD'
          ));
          if (usr.rol === Rol.Estudiante) {
            setActiveTab('estudiante');
          } else if (usr.rol === Rol.Docente) {
            setActiveTab('docente');
          } else {
            setActiveTab('dashboard');
          }
        }}
        onRegister={handleRegisterUser}
        triggerAlert={triggerAlert}
        triggerConfirm={triggerConfirm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between grid-lines relative overflow-hidden">

      {/* Giant decoration text from the design theme */}
      <div className="absolute top-12 right-12 text-giant text-slate-200/50 pointer-events-none select-none z-0 tracking-tighter uppercase font-black font-display">
        ADMISIÓN
      </div>

      {/* Main system header */}
      <header className="bg-white/90 backdrop-blur-md border-b-2 border-slate-200 py-5 px-6 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Institution Header Branding */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl shadow-lg border-2 border-slate-700">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                UAGRM<span className="text-blue-600">CUP</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono font-black tracking-widest uppercase mt-0.5">
                Facultad de Ingeniería en Ciencias de la Computación (FICCT)
              </p>
            </div>
          </div>

          {/* Active Logged-in user profile summary with logout action */}
          <div className="flex items-center gap-3 bg-slate-100/90 py-1.5 pl-4 pr-2 rounded-2xl border-2 border-slate-200 w-full md:w-auto justify-between md:justify-start">
            <div className="text-left font-sans mr-2">
              <span className="text-[9px] uppercase font-mono font-black text-blue-600 tracking-wider">Sesión: {activeUser.rol.toUpperCase()}</span>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[170px]">{activeUser.nombre_completo}</p>
            </div>
            <button
              onClick={() => {
                triggerConfirm(
                  '¿Está seguro de cerrar su sesión de acceso actual del sistema de Admisión CUP?',
                  () => {
                    setDb(prev => logAction(
                      prev,
                      activeUser.id,
                      activeUser.nombre_completo,
                      `El usuario ${activeUser.nombre_completo} [Rol: ${activeUser.rol}] cerró sesión.`,
                      'SISTEMA / SEGURIDAD'
                    ));
                    setSessionUser(null);
                  },
                  'Cerrar Sesión'
                );
              }}
              className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-sans font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all border border-slate-750 shrink-0"
            >
              Cerrar Sesión
            </button>
          </div>

        </div>
      </header>

      {/* Primary Container layout Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full grid grid-cols-1 xl:grid-cols-4 gap-8 z-10 relative">

        {/* LEFT COLUMN: Main Menu items / UI Navigation and voice module */}
        <div className="xl:col-span-1 space-y-6">

          {/* Main Impersonated session details */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest leading-none">Mi Identidad Activa</p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-900 shrink-0" />
              <span className="font-sans font-black text-slate-900 text-sm">{activeUser.nombre_completo.toUpperCase()}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Modo simulación activo como <span className="font-black text-slate-900 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">{activeUser.rol}</span>.
            </p>
          </div>

          {/* Tab Selection Menu list styled with high contrast bold menu triggers */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-4 space-y-1.5">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 pb-2.5 border-b border-slate-100">Secciones Principales</span>

            {activeUser.rol === Rol.Administrador && (
              <div className="space-y-1 pt-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left cursor-pointer px-4 py-3 rounded-xl text-xs font-sans font-black transition-all flex items-center gap-3 ${activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-lg border border-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                    }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${activeTab === 'dashboard' ? 'bg-white scale-125' : 'border-2 border-slate-400'}`}></span>
                  PANEL DE ADMISIÓN
                </button>
              </div>
            )}

            {activeUser.rol === Rol.Docente && (
              <div className="space-y-1 pt-2">
                <button
                  onClick={() => setActiveTab('docente')}
                  className={`w-full text-left cursor-pointer px-4 py-3 rounded-xl text-xs font-sans font-black transition-all flex items-center gap-3 ${activeTab === 'docente'
                    ? 'bg-blue-600 text-white shadow-lg border border-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                    }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${activeTab === 'docente' ? 'bg-white scale-125' : 'border-2 border-slate-400'}`}></span>
                  CÁTEDRA RENDIMIENTO
                </button>
              </div>
            )}

            {activeUser.rol === Rol.Estudiante && (
              <div className="space-y-1 pt-2">
                <button
                  onClick={() => setActiveTab('estudiante')}
                  className={`w-full text-left cursor-pointer px-4 py-3 rounded-xl text-xs font-sans font-black transition-all flex items-center gap-3 ${activeTab === 'estudiante'
                    ? 'bg-blue-600 text-white shadow-lg border border-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                    }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${activeTab === 'estudiante' ? 'bg-white scale-125' : 'border-2 border-slate-400'}`}></span>
                  CARPETA POSTULANTE
                </button>
              </div>
            )}

            {/* Direct reports access for docents and administrators as requested */}
            {(activeUser.rol === Rol.Docente || activeUser.rol === Rol.Administrador) && (
              <div className="border-t border-slate-100 mt-2.5 pt-2.5 space-y-1 block">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pb-1">Reportes & Listas</span>
                <button
                  onClick={() => setActiveTab('reportes')}
                  className={`w-full text-left cursor-pointer px-4 py-3 rounded-xl text-xs font-sans font-black transition-all flex items-center gap-3 ${activeTab === 'reportes'
                    ? 'bg-blue-600 text-white shadow-lg border border-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                    }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${activeTab === 'reportes' ? 'bg-white scale-125' : 'border-2 border-slate-400'}`}></span>
                  NOTAS Y APROBADOS
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT AREA: Active workspace portal */}
        <div className="xl:col-span-3 space-y-6">

          {/* VIEW CONTROLS ROUTER */}

          {activeTab === 'dashboard' && activeUser.rol === Rol.Administrador && (
            <AdminPanel
              usuarios={db.usuarios}
              estudiantes={db.estudiantes}
              docentes={db.docentes}
              payments={db.pagos}
              grupos={db.grupos}
              grades={db.notas}
              bitacoras={db.bitacoras}
              carreras={db.carreras}
              materias={db.materias}
              historialAprobados={db.historialAprobados}
              periodoActivo={db.periodoActivo}
              periodos={db.periodos}
              cuposCarreras={db.cuposCarreras}
              notaMinimaAprobacion={db.notaMinimaAprobacion}
              onUpdateAdminSettings={(settings) => setDb(prev => ({ ...prev, ...settings }))}
              onUpdateEstudiantesEstado={(updated) => setDb(prev => ({ ...prev, estudiantes: updated }))}
              onUpdateHistorialAprobados={(updated) => setDb(prev => ({ ...prev, historialAprobados: updated }))}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onApprovePayment={handleApprovePayment}
              onResetDatabase={handleResetDatabase}
              onLogAction={handleLogAction}
              onBatchImport={handleBatchImport}
              triggerAlert={triggerAlert}
              triggerConfirm={triggerConfirm}
            />
          )}

          {activeTab === 'docente' && activeUser.rol === Rol.Docente && (
            <DocentePanel
              user={activeUser}
              docente={db.docentes.find(d => d.usuario_id === activeUser.id)!}
              grupos={db.grupos}
              estudiantes={db.estudiantes}
              usuarios={db.usuarios}
              grades={db.notas}
              attendances={db.asistencias}
              materias={db.materias}
              onUpdateGrades={(updated) => setDb(prev => ({ ...prev, notas: updated }))}
              onSaveGrade={handleSaveStudentGrade}
              onUpdateAttendance={(updated) => setDb(prev => ({ ...prev, asistencias: updated }))}
              onLogAction={handleLogAction}
              triggerAlert={triggerAlert}
              triggerConfirm={triggerConfirm}
            />
          )}

          {activeTab === 'estudiante' && activeUser.rol === Rol.Estudiante && (
            <EstudiantePanel
              user={activeUser}
              estudiante={db.estudiantes.find(e => e.usuario_id === activeUser.id)!}
              payments={db.pagos}
              grades={db.notas}
              attendances={db.asistencias}
              carreras={db.carreras}
              materias={db.materias}
              usuarios={db.usuarios}
              grupos={db.grupos}
              notaMinimaAprobacion={db.notaMinimaAprobacion}
              onUploadVoucher={handleStudentUploadVoucher}
              onUpdateDocs={handleStudentUploadDocs}
              onUpdatePassword={handleStudentUpdatePassword}
              admissionResult={admissionResults.find(a => a.estudiante_id === activeUser.id)!}
              triggerAlert={triggerAlert}
              triggerConfirm={triggerConfirm}
            />
          )}

          {activeTab === 'reportes' && (activeUser.rol === Rol.Docente || activeUser.rol === Rol.Administrador) && (
            <ReportPanel
              usuarios={db.usuarios}
              estudiantes={db.estudiantes}
              payments={db.pagos}
              grupos={db.grupos}
              grades={db.notas}
              carreras={db.carreras}
              materias={db.materias}
            />
          )}

        </div>

      </main>

      {/* Systems audit signature footer */}
      <footer className="bg-slate-900 border-t-4 border-slate-800 text-slate-400 py-6 px-6 md:px-8 mt-12 text-xs relative z-10 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-bold text-slate-400 text-center md:text-left">
            &copy; 2026 FACULTAD DE INGENIERÍA DE CIENCIAS DE LA COMPUTACIÓN (UAGRM) - SISTEMAS I - GRUPO 21
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            <span>BD: POSTGRESQL</span>
            <span>SEGURIDAD: BCRYPT ENCRYPT</span>
            <span>AUDITORÍA: LIVE LOGGING</span>
          </div>
        </div>
      </footer>

      {/* Custom dialog/modal portal inside the component tree */}
      {dialog && dialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-650"></div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-800 border-2 border-slate-900">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-1 select-text">
                <h3 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400">
                  {dialog.title}
                </h3>
                <p className="text-xs font-black text-slate-800 leading-relaxed font-sans pr-2 whitespace-pre-line">
                  {dialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {dialog.showCancel && (
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] uppercase tracking-wider font-black font-sans px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all font-sans"
                >
                  {dialog.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                type="button"
                onClick={dialog.onConfirm}
                className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black font-sans px-4 py-2.5 rounded-xl border-2 border-slate-900 transition-all font-sans shadow shadow-slate-900/10"
              >
                {dialog.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
