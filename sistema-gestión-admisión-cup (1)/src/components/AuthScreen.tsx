import React, { useState, useEffect } from 'react';
import { Usuario, EstudianteDetalle, Pago, Rol, Carrera } from '../types';
import { 
  GraduationCap, 
  LogIn, 
  UserPlus, 
  Key, 
  Mail, 
  Shield, 
  AlertCircle, 
  Sparkles,
  QrCode,
  CreditCard,
  Landmark,
  ChevronLeft,
  Check,
  Upload,
  ArrowRight,
  HelpCircle,
  FileText,
  Printer,
  CheckCircle
} from 'lucide-react';

interface AuthScreenProps {
  usuarios: Usuario[];
  estudiantes?: EstudianteDetalle[];
  carreras: Carrera[];
  onLogin: (user: Usuario) => void;
  onRegister: (newUser: Usuario, customDetails: any) => void;
  triggerAlert?: (message: string, title?: string) => void;
  triggerConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function AuthScreen({ usuarios, estudiantes = [], onLogin, onRegister, carreras, triggerAlert }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Custom alert wrapper
  const showAlert = (message: string, title = 'Notificación') => {
    if (triggerAlert) {
      triggerAlert(message, title);
    } else {
      alert(message);
    }
  };
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register common fields
  const [regRole, setRegRole] = useState<Rol>(Rol.Estudiante);
  const [regNombre, setRegNombre] = useState('');
  const [regCI, setRegCI] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // Register Student specific fields
  const [regCarrera1, setRegCarrera1] = useState(carreras[0]?.id || 1);
  const [regCarrera2, setRegCarrera2] = useState(carreras[1]?.id || 2);
  const [regTurno, setRegTurno] = useState<'Mañana' | 'Tarde' | 'Noche'>('Mañana');
  const [regColegio, setRegColegio] = useState('');
  const [regCiudad, setRegCiudad] = useState('Santa Cruz');
  const [regCelular, setRegCelular] = useState('');
  const [regHasTitle, setRegHasTitle] = useState(true);
  const [regFechaNacimiento, setRegFechaNacimiento] = useState('2008-01-01');
  const [regSexo, setRegSexo] = useState<'Masculino' | 'Femenino'>('Masculino');

  // Password Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [foundUser, setFoundUser] = useState<Usuario | null>(null);
  const [foundCelular, setFoundCelular] = useState('');

  const handleSearchRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setFoundUser(null);
    setFoundCelular('');

    if (!recoveryInput.trim()) {
      setRecoveryError('Por favor ingrese su correo electrónico, C.I. o registro.');
      return;
    }

    const matched = usuarios.find(
      u => u.email.toLowerCase() === recoveryInput.toLowerCase().trim() || 
           u.codigo_registro === recoveryInput.trim() ||
           u.ci === recoveryInput.trim()
    );

    if (!matched) {
      setRecoveryError('Usuario no encontrado en el sistema.');
      return;
    }

    setFoundUser(matched);

    if (matched.rol === Rol.Estudiante) {
      const detail = estudiantes.find(est => est.usuario_id === matched.id);
      if (detail && detail.celular) {
        setFoundCelular(detail.celular);
      } else {
        setFoundCelular('77011223');
      }
    }
  };

  // Register Teacher/Admin specific fields
  const [regEspecialidad, setRegEspecialidad] = useState('Computación');

  // Interactive Payment Gateway States
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'card' | 'transfer'>('qr');
  const [pendingUser, setPendingUser] = useState<Usuario | null>(null);
  const [pendingDetails, setPendingDetails] = useState<any>(null);
  const [registeredCredentials, setRegisteredCredentials] = useState<{
    username: string;
    pass: string;
    fullName: string;
    ci: string;
    career: string;
    paymentRef: string;
    paymentMethod: string;
    date: string;
    status: string;
  } | null>(null);

  // Interactive Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Interactive Transfer/Deposit fields
  const [transferRef, setTransferRef] = useState('');
  const [transferBank, setTransferBank] = useState('Banco Unión');
  const [transferSlipName, setTransferSlipName] = useState<string | null>(null);
  const [transferUploaded, setTransferUploaded] = useState(false);
  const [autoApproveTransfer, setAutoApproveTransfer] = useState(true); // Default true for easiest testing

  // QR Simulated Timer State (for visual high-fidelity)
  const [qrTimer, setQrTimer] = useState('04:59');
  
  useEffect(() => {
    let interval: any;
    if (showPaymentGateway && paymentMethod === 'qr') {
      let seconds = 299;
      interval = setInterval(() => {
        if (seconds > 0) {
          seconds--;
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          setQrTimer(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
          seconds = 299; // Loop back
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPaymentGateway, paymentMethod]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Por favor ingrese su correo electrónico o registro.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Por favor ingrese su contraseña.');
      return;
    }

    // Match by email OR by register code (codigo_registro) OR CI
    const matched = usuarios.find(
      u => u.email.toLowerCase() === loginEmail.toLowerCase().trim() || 
           u.codigo_registro === loginEmail.trim() ||
           u.ci === loginEmail.trim()
    );

    if (matched) {
      if (matched.estado === false) {
        setLoginError('Su usuario está inactivo o suspendido en el sistema.');
        return;
      }
      if (matched.password && matched.password !== loginPassword) {
        setLoginError('Contraseña incorrecta.');
        return;
      }
      onLogin(matched);
    } else {
      setLoginError('Credenciales incorrectas o usuario no encontrado.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre.trim() || !regCI.trim() || !regEmail.trim()) {
      showAlert('Por favor complete todos el nombre, C.I. y el correo electrónico.', 'Datos Incompletos');
      return;
    }

    // Name Validation (letters and spaces only, min 5 chars)
    const nombreRegex = /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]{5,100}$/;
    if (!nombreRegex.test(regNombre.trim())) {
      showAlert('El nombre completo debe tener al menos 5 caracteres y contener únicamente letras.', 'Nombre Inválido');
      return;
    }

    // C.I. Validation (5-12 alphanumeric chars/hyphen)
    const ciRegex = /^[0-9a-zA-Z-]{5,12}$/;
    if (!ciRegex.test(regCI.trim())) {
      showAlert('El número de C.I. debe tener entre 5 y 12 caracteres (solo números, letras o guión).', 'C.I. Inválido');
      return;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      showAlert('Por favor ingrese una dirección de correo electrónico válida.', 'Correo Inválido');
      return;
    }

    // Student specific validations
    if (regRole === Rol.Estudiante) {
      // Phone number (exactly 8 digits)
      const celularRegex = /^[0-9]{8}$/;
      if (!celularRegex.test(regCelular.trim())) {
        showAlert('El número de celular debe contener exactamente 8 dígitos numéricos.', 'Celular Inválido');
        return;
      }

      // Birth date validation (age between 14 and 60)
      const birthDate = new Date(regFechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (isNaN(birthDate.getTime()) || age < 14 || age > 60) {
        showAlert('La fecha de nacimiento es inválida o la edad del postulante debe estar entre 14 y 60 años.', 'Fecha de Nacimiento Inválida');
        return;
      }
    }

    // Verify unique email/CI
    const exists = usuarios.some(
      u => u.email.trim().toLowerCase() === regEmail.trim().toLowerCase() || 
           u.ci.trim().toLowerCase() === regCI.trim().toLowerCase()
    );
    if (exists) {
      showAlert('Ya existe un usuario registrado con ese Correo Electrónico o número de C.I.', 'Registro Duplicado');
      return;
    }

    const newUserId = `u-reg-${Date.now()}`;
    const generatedReg = `${2260 + Math.floor(Math.random() * 900)}${Math.floor(10000 + Math.random() * 90000)}`;

    const newUser: Usuario = {
      id: newUserId,
      codigo_registro: generatedReg,
      ci: regCI.trim(),
      nombre_completo: regNombre.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regCI.trim(), // Contraseña por defecto es su CI
      rol: regRole,
      estado: true,
      created_at: new Date().toISOString()
    };

    let customDetails: any = null;

    if (regRole === Rol.Estudiante) {
      customDetails = {
        studentDetail: {
          usuario_id: newUserId,
          carrera_opcion_1: Number(regCarrera1),
          carrera_opcion_2: Number(regCarrera2),
          turno_preferido: regTurno,
          nro_intentos: 1,
          estado_cup: 'Postulante' as const,
          colegio_procedencia: regColegio.trim() || 'Particular San Francisco',
          ciudad: regCiudad,
          celular: regCelular || '77011223',
          direccion: 'Av. Irala Nro 425',
          fecha_nacimiento: regFechaNacimiento,
          sexo: regSexo,
          titulo_bachiller: regHasTitle,
          otros_documentos: 'Formulario de Inscripción digitalizado.'
        } as EstudianteDetalle,
        initialPayment: {
          id: `p-reg-${Date.now()}`,
          estudiante_id: newUserId,
          monto: 700.00,
          nro_factura: '',
          estado_pago: 'Pendiente' as const,
          created_at: new Date().toISOString()
        } as Pago
      };

      // Set pending state and request payment validation
      setPendingUser(newUser);
      setPendingDetails(customDetails);
      setShowPaymentGateway(true);
      
      // Auto fill card / reference holder name for ease of use
      setCardName(regNombre.toUpperCase());
    } else {
      // Teachers / Admins do not require the standard 700 Bs. admission fee
      if (regRole === Rol.Docente) {
        customDetails = {
          docenteDetail: {
            usuario_id: newUserId,
            especialidad: regEspecialidad,
            es_profesional: true,
            tiene_maestria: true,
            tiene_diplomado: true,
            grupos_asignados: ['g-1', 'g-2']
          }
        };
      } else {
        customDetails = {};
      }
      onRegister(newUser, customDetails);
      showAlert(`¡Bienvenido al Portal, ${newUser.nombre_completo.toUpperCase()}!\n\nSu código de ingreso asignado es:\n\n👉  ${generatedReg}`, '¡Registro Exitoso!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-2xl w-full z-10 space-y-6">
        
        {/* Logo / Header block */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl text-white mb-2">
            <GraduationCap className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase font-sans">
            SISTEMA CUP DE ADMISIÓN
          </h1>
          <p className="text-slate-450 text-xs font-mono font-bold tracking-widest uppercase">
            FACULTAD DE INGENIERÍA EN CIENCIAS DE LA COMPUTACIÓN - UAGRM
          </p>
        </div>

        {/* Outer Login card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden">
          {registeredCredentials ? (
            <div id="printable-receipt" className="space-y-6 text-white bg-slate-900 p-6 md:p-8 shrink-0">
              <div className="text-center space-y-2 border-b-2 border-slate-850 pb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl mx-auto shadow-lg">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-black tracking-tight uppercase text-white">FICHA DE INSCRIPCIÓN Y BOLETA DE PAGO</h2>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  CURSO DE ADMISIÓN Y PREPARACIÓN (CUP) - UAGRM
                </p>
              </div>

              <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl p-4 text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                <h3 className="text-sm font-black text-emerald-400 uppercase">¡PAGO REGISTRADO EXITOSAMENTE!</h3>
                <p className="text-xs text-slate-350">Su arancel ha sido validado. Sus credenciales de acceso ya están habilitadas.</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-black text-slate-450 tracking-widest border-b border-slate-800 pb-1">Credenciales de Acceso Asignadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-sm">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Usuario (Código de Registro):</span>
                    <strong className="text-blue-400 font-black text-base">{registeredCredentials.username}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Contraseña (C.I.):</span>
                    <strong className="text-emerald-400 font-black text-base">{registeredCredentials.pass}</strong>
                  </div>
                </div>
                <p className="text-[9.5px] text-slate-500 italic">* Utilice estas credenciales en la pestaña "Ingresar al Portal" para iniciar sesión en el sistema.</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-black text-slate-450 tracking-widest border-b border-slate-800 pb-1">Detalle del Postulante</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Nombre Completo:</span>
                    <span className="font-bold">{registeredCredentials.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Cédula de Identidad:</span>
                    <span className="font-bold">{registeredCredentials.ci}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Carrera Elegida:</span>
                    <span className="font-bold text-blue-400">{registeredCredentials.career}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Fecha de Emisión:</span>
                    <span className="font-bold">{registeredCredentials.date}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-black text-slate-450 tracking-widest border-b border-slate-800 pb-1">Detalle de Facturación y Pago</h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Monto Cancelado:</span>
                    <strong className="text-emerald-400 font-black">700.00 Bs.</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Método de Pago:</span>
                    <span className="font-bold">{registeredCredentials.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Referencia / Factura:</span>
                    <span className="font-mono font-bold text-slate-300">{registeredCredentials.paymentRef}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Estado de Matrícula:</span>
                    <span className={`font-bold uppercase ${registeredCredentials.status === 'Pagado' ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {registeredCredentials.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-4 border-t-2 border-slate-850 print:hidden">
                <div className="flex-1 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all border border-blue-400 shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <Printer className="w-5 h-5 text-white" />
                    Imprimir / Guardar PDF
                  </button>
                  <span className="text-[8.5px] text-slate-500 text-center font-sans">
                    * Seleccione "Guardar como PDF" en el destino de impresión.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(registeredCredentials.username);
                    setRegisteredCredentials(null);
                    setActiveTab('login');
                  }}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 active:scale-[0.99] text-slate-200 hover:text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all border border-slate-800 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <LogIn className="w-5 h-5 text-slate-400" />
                  Iniciar Sesión en el Portal
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab selector */}
              <div className="grid grid-cols-2 border-b-2 border-slate-800 font-sans text-xs">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-4 font-black transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-slate-850 text-white border-b-4 border-blue-500'
                  : 'text-slate-400 hover:text-white bg-slate-900/40'
              }`}
            >
              <LogIn className="w-4 h-4 text-blue-500" />
              Ingresar al Portal
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`py-4 font-black transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-slate-850 text-white border-b-4 border-blue-500'
                  : 'text-slate-400 hover:text-white bg-slate-900/40'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Registrarse (Nuevo Usuario)
            </button>
          </div>

          <div className="p-6 md:p-8 shrink-0">
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {loginError && (
                  <div className="bg-rose-500/10 border-2 border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="font-sans font-bold leading-relaxed">{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Correo Electrónico / Registro Académico:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="ej: mateo.sandoval@gmail.com o 226040101"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Contraseña de Acceso:
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 leading-snug tracking-wide block">
                    <span>* Ingrese su contraseña de acceso asignada.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryModal(true);
                        setRecoveryInput('');
                        setRecoveryError('');
                        setFoundUser(null);
                        setFoundCelular('');
                      }}
                      className="text-blue-500 hover:text-blue-400 font-sans cursor-pointer underline hover:no-underline"
                    >
                      ¿Olvidó su contraseña?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-black uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all border border-blue-500 shadow-lg mt-2 shadow-blue-500/10"
                >
                  Confirmar Credenciales de Acceso
                </button>
              </form>
            ) : showPaymentGateway && pendingUser ? (
              <div className="space-y-6">
                {/* Header summary of registration */}
                <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 space-y-3 relative">
                  <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 text-[9px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                     Paso 2 / 2: Pago en Espera
                  </div>
                  <h3 className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 animate-bounce" />
                    Detalle de Inscripción CUP
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-slate-300 font-sans text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Postulante:</span>
                      <strong className="text-white font-black">{pendingUser.nombre_completo.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Cédula Identidad:</span>
                      <strong className="text-white font-mono">{pendingUser.ci}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Carrera Elegida (Opc 1):</span>
                      <strong className="text-blue-400 font-bold">
                        {carreras.find(c => c.id === Number(regCarrera1))?.nombre || 'Ingeniería'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Arancel Académico CUP:</span>
                      <strong className="text-emerald-400 font-mono font-extrabold text-sm">700.00 Bs.</strong>
                    </div>
                  </div>
                </div>

                {/* Tab selector for payment options */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Seleccione su Método de Pago Seguro:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qr')}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'qr'
                          ? 'border-emerald-500 bg-emerald-950/20 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-[9px] uppercase font-black tracking-wider text-center">Código QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-950/20 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-blue-400 mb-1" />
                      <span className="text-[9px] uppercase font-black tracking-wider text-center">Tarjeta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-amber-500 bg-amber-955/20 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <Landmark className="w-5 h-5 text-amber-550 mb-1" />
                      <span className="text-[9px] uppercase font-black tracking-wider text-center">Depósito</span>
                    </button>
                  </div>
                </div>

                {/* Subsections based on payment method */}
                {paymentMethod === 'qr' && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs uppercase font-black text-emerald-400 tracking-wider">PAGO EXPRESS POR SIMPLE QR</h4>
                      <p className="text-[10.5px] text-slate-400 max-w-sm">
                        Escanee el código QR desde la aplicación móvil de su entidad financiera de preferencia. El pago se registrará y acreditará automáticamente.
                      </p>
                    </div>

                    {/* Highly Polished custom QR card component */}
                    <div className="relative p-4 bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-500 flex flex-col items-center justify-center w-48 h-48 group">
                      
                      {/* Rotating Scanner scanline effect */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-60 animate-[bounce_3s_infinite] pointer-events-none"></div>

                      {/* Mock QR pixel details */}
                      <div className="grid grid-cols-6 gap-1 w-32 h-32 relative">
                        {/* Corner markers */}
                        <div className="border-[6px] border-slate-900 w-8 h-8 rounded absolute top-0 left-0"></div>
                        <div className="border-[6px] border-slate-900 w-8 h-8 rounded absolute top-0 right-0"></div>
                        <div className="border-[6px] border-slate-900 w-8 h-8 rounded absolute bottom-0 left-0"></div>
                        {/* Center decorative logo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-md border border-slate-300 shadow">
                          <GraduationCap className="w-6 h-6 text-blue-600 font-black" />
                        </div>
                        {/* Visual grid items representations */}
                        {Array.from({ length: 36 }).map((_, i) => {
                          const show = (i % 3 === 0 || i % 5 === 2 || i % 7 === 1) && i > 5 && i < 30;
                          return (
                            <div 
                              key={i} 
                              className={`rounded-[1.5px] transition-all duration-305 ${show ? 'bg-slate-900' : 'bg-transparent'}`}
                            />
                          );
                        })}
                      </div>

                      <span className="text-[8px] font-bold font-mono text-slate-500 tracking-widest mt-2 block uppercase">
                        MULTIPAGO QR UAGRM
                      </span>
                    </div>

                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center gap-2 text-rose-450">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wide">
                          Expira en: <span className="text-rose-400 font-extrabold">{qrTimer}</span>
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-500 leading-snug">
                        * Procesado de forma oficial por la red de bancos autorizados (ASOBAN).
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!pendingUser) return;
                        // Confirm instant payment
                        const finalDetails = {
                          ...pendingDetails,
                          initialPayment: {
                            ...pendingDetails.initialPayment,
                            estado_pago: 'Pagado' as const,
                            nro_factura: `FAC-${Math.floor(10000 + Math.random() * 90000)}`,
                            fecha_pago: new Date().toISOString(),
                            comprobante_url: 'Habilitado instantáneamente mediante código QR único.'
                          }
                        };
                        onRegister(pendingUser, finalDetails);
                        
                        const careerName = carreras.find(c => c.id === Number(regCarrera1))?.nombre || 'Ingeniería';
                        setRegisteredCredentials({
                          username: pendingUser.codigo_registro,
                          pass: pendingUser.ci,
                          fullName: pendingUser.nombre_completo,
                          ci: pendingUser.ci,
                          career: careerName,
                          paymentRef: finalDetails.initialPayment.nro_factura,
                          paymentMethod: 'Código QR Simple',
                          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                          status: 'Pagado'
                        });
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all border border-emerald-400 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-5 h-5 text-white" />
                      Confirmar Pago QR y Habilitar Inscripción
                    </button>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    
                    {/* Visual Card mockup */}
                    <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-5 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden h-44 flex flex-col justify-between font-mono text-white text-xs max-w-sm mx-auto">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[8px] tracking-widest uppercase font-bold text-indigo-400 leading-none block">
                            TARJETA DE DÉBITO / CRÉDITO CUP
                          </span>
                          <div className="w-9 h-6.5 bg-amber-500/20 border border-amber-500/40 rounded-md flex items-center justify-center mt-1">
                            <div className="w-5.5 h-4.5 bg-amber-500/40 rounded"></div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black italic tracking-wide text-indigo-300">UAGRM FICCT</span>
                      </div>
                      
                      <div className="text-sm tracking-widest font-black py-2 text-center text-slate-100">
                        {cardNumber || '••••  ••••  ••••  ••••'}
                      </div>
                      
                      <div className="flex justify-between items-end text-[9px] uppercase tracking-wider text-slate-300">
                        <div className="max-w-[70%] truncate">
                          <span className="text-[6.5px] text-slate-500 block leading-none mb-0.5">Titular</span>
                          <span className="font-bold truncate text-[9.5px]">{cardName || 'TITULAR DE LA TARJETA'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[6.5px] text-slate-500 block leading-none mb-0.5">Vence</span>
                          <span className="font-bold">{cardExpiry || '12/29'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400">
                          Titular de la Tarjeta:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="MATEO SANDOVAL ANTELO"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400">
                          Número de Tarjeta:
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={(e) => {
                            // Strip non-digits and format with spaces every 4 characters
                            const v = e.target.value.replace(/\D/g, '');
                            const matches = v.match(/\d{1,4}/g);
                            const formatted = matches ? matches.join('  ') : '';
                            setCardNumber(formatted);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400">
                          Fecha Expiración:
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '');
                            if (v.length > 2) {
                              v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                            }
                            setCardExpiry(v);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400">
                          Código Seguridad (CVV):
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!cardName.trim() || cardNumber.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
                          showAlert('Por favor complete todos campos válidos de la tarjeta bancaria de débito o crédito.', 'Validación Fallida');
                          return;
                        }
                        if (!pendingUser) return;
                        
                        // Confirm card cleared
                        const finalDetails = {
                          ...pendingDetails,
                          initialPayment: {
                            ...pendingDetails.initialPayment,
                            estado_pago: 'Pagado' as const,
                            nro_factura: `FAC-${Math.floor(10000 + Math.random() * 90000)}`,
                            fecha_pago: new Date().toISOString(),
                            comprobante_url: `Pagado vía Tarjeta de Crédito (Terminada en ${cardNumber.slice(-4)})`
                          }
                        };
                        onRegister(pendingUser, finalDetails);
                        
                        const careerName = carreras.find(c => c.id === Number(regCarrera1))?.nombre || 'Ingeniería';
                        setRegisteredCredentials({
                          username: pendingUser.codigo_registro,
                          pass: pendingUser.ci,
                          fullName: pendingUser.nombre_completo,
                          ci: pendingUser.ci,
                          career: careerName,
                          paymentRef: finalDetails.initialPayment.nro_factura,
                          paymentMethod: 'Tarjeta de Crédito/Débito',
                          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                          status: 'Pagado'
                        });
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all border border-blue-400 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5 text-white" />
                      Procesar Pago con Tarjeta (700 Bs)
                    </button>
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    
                    <div className="space-y-1">
                      <h4 className="text-xs uppercase font-black text-amber-450 tracking-wider">CUENTAS CORRIENTES FISCALES AUTORIZADAS</h4>
                      <p className="text-[10.5px] text-slate-400">
                        Realice el depósito por ventanilla o transferencia electrónica interbancaria directo a cualquiera de las siguientes cuentas de la Universidad:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 relative space-y-1">
                        <strong className="text-white text-[11px] block">🏦 BANCO UNIÓN S.A.</strong>
                        <p className="text-slate-450 text-[10px]">Número de cuenta:</p>
                        <p className="font-mono font-black text-white text-sm">10000049281</p>
                        <p className="text-[9px] text-slate-500">UAGRM CUP Convenio Facultativo</p>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 relative space-y-1">
                        <strong className="text-white text-[11px] block">🏦 BANCO MERCANTIL SANTA CRUZ</strong>
                        <p className="text-slate-450 text-[10px]">Número de cuenta:</p>
                        <p className="font-mono font-black text-white text-sm">4010-928135</p>
                        <p className="text-[9px] text-slate-500">CUP - Facultad de Computación</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-black text-slate-400">Banco de Origen:</label>
                          <select
                            value={transferBank}
                            onChange={(e) => setTransferBank(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Banco Unión">Banco Unión</option>
                            <option value="Banco Mercantil Santa Cruz">Banco Mercantil Santa Cruz</option>
                            <option value="Banco Nacional de Bolivia (BNB)">Banco Nacional de Bolivia</option>
                            <option value="Banco de Crédito de Bolivia (BCP)">Banco de Crédito (BCP)</option>
                            <option value="Banco Ganadero">Banco Ganadero</option>
                            <option value="Banco Económico">Banco Económico</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-black text-slate-400">Número de Referencia/Operación:</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: REF-9281034"
                            value={transferRef}
                            onChange={(e) => setTransferRef(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Animated simulated File drag and drop selector */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] uppercase font-black text-slate-400">Comprobante de Pago (Boleta Digital/Foto):</label>
                        <div 
                          onClick={() => {
                            setTransferSlipName("Boleta_UAGRM_CUP_700Bs.png");
                            setTransferUploaded(true);
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
                            transferUploaded 
                              ? 'border-emerald-500/50 bg-emerald-950/10' 
                              : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {transferUploaded ? (
                            <>
                              <Check className="w-6 h-6 text-emerald-400 animate-bounce" />
                              <span className="text-[11px] font-bold text-slate-200">{transferSlipName}</span>
                              <span className="text-[9px] text-emerald-400 font-bold">✓ Archivo cargado en cola del sistema.</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-500" />
                              <span className="text-[11px] text-slate-350 font-bold">Haga clic o arrastre su comprobante de pago aquí</span>
                              <span className="text-[9px] text-slate-500">Formatos de imagen sugeridos para la simulación</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Auto approve toggle for extreme ease of evaluate */}
                      <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <input
                          type="checkbox"
                          id="autoApproveTransfer"
                          checked={autoApproveTransfer}
                          onChange={(e) => setAutoApproveTransfer(e.target.checked)}
                          className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-100/10 cursor-pointer"
                        />
                        <label htmlFor="autoApproveTransfer" className="text-[10px] text-slate-400 font-bold cursor-pointer select-none">
                          ⚡ Auto-aprobar boleta e iniciar sesión habilitado (Evita revisión manual).
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!transferRef.trim()) {
                          showAlert('Por favor ingrese el número de referencia o depósito de la transacción bancaria.', 'Datos de Transacción Vacíos');
                          return;
                        }

                        // Complete registration with choice of status
                        const finalDetails = {
                          ...pendingDetails,
                          initialPayment: {
                            ...pendingDetails.initialPayment,
                            estado_pago: autoApproveTransfer ? ('Pagado' as const) : ('Pendiente' as const),
                            nro_factura: transferRef.trim(),
                            fecha_pago: autoApproveTransfer ? new Date().toISOString() : null,
                            comprobante_url: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&w=300&q=80'
                          }
                        };
                        
                        if (!pendingUser) return;
                        onRegister(pendingUser, finalDetails);
                        
                        const careerName = carreras.find(c => c.id === Number(regCarrera1))?.nombre || 'Ingeniería';
                        setRegisteredCredentials({
                          username: pendingUser.codigo_registro,
                          pass: pendingUser.ci,
                          fullName: pendingUser.nombre_completo,
                          ci: pendingUser.ci,
                          career: careerName,
                          paymentRef: finalDetails.initialPayment.nro_factura,
                          paymentMethod: `Depósito Bancario / Transferencia (${transferBank})`,
                          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                          status: autoApproveTransfer ? 'Pagado' : 'Pendiente de Validación'
                        });
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/20 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all border border-amber-400 shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      <Landmark className="w-5 h-5 text-white" />
                      Registrar Depósito Bancario (700 Bs)
                    </button>
                  </div>
                )}

                {/* Cancel Wizard back button */}
                <button
                  type="button"
                  onClick={() => {
                    // Reset show wizard but keep original user inputs intact
                    setShowPaymentGateway(false);
                    setTransferUploaded(false);
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Volver al Formulario de Registro
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Informative notice explaining only Students can register */}
                <div className="bg-blue-950/40 border border-blue-800/60 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed font-sans flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-blue-400 uppercase tracking-wider block mb-0.5">Registro Exclusivo para Estudiantes</span>
                    <p>Esta sección es de auto-registro únicamente para <strong>Postulantes del CUP</strong>. El personal Docente y Administrativo es registrado directamente por Administración Central y logueado mediante las credenciales enviadas a su correo electrónico de ingreso.</p>
                  </div>
                </div>

                {/* Common fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                      Nombre Completo:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre y Apellidos"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                      Cédula de Identidad (C.I.):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 8901234"
                      value={regCI}
                      onChange={(e) => setRegCI(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@uagrm.bo"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Role specific forms */}
                {regRole === Rol.Estudiante && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest block border-b border-slate-800 pb-1.5">
                      Detalles de Postulación
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400">1ra Opción Carrera:</label>
                        <select
                          value={regCarrera1}
                          onChange={(e) => setRegCarrera1(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          {carreras.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400">2da Opción Carrera:</label>
                        <select
                          value={regCarrera2}
                          onChange={(e) => setRegCarrera2(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          {carreras.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Turno Preferido:</label>
                        <select
                          value={regTurno}
                          onChange={(e) => setRegTurno(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          <option value="Mañana">Mañana</option>
                          <option value="Tarde">Tarde</option>
                          <option value="Noche">Noche</option>
                        </select>
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Colegio de Procedencia:</label>
                        <input
                          type="text"
                          placeholder="Colegio Nacional Florida"
                          value={regColegio}
                          onChange={(e) => setRegColegio(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Ciudad de origen:</label>
                        <input
                          type="text"
                          value={regCiudad}
                          onChange={(e) => setRegCiudad(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Celular de contacto:</label>
                        <input
                          type="tel"
                          placeholder="77055443"
                          value={regCelular}
                          onChange={(e) => setRegCelular(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Fecha de Nacimiento:</label>
                        <input
                          type="date"
                          required
                          value={regFechaNacimiento}
                          onChange={(e) => setRegFechaNacimiento(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Sexo:</label>
                        <select
                          value={regSexo}
                          onChange={(e) => setRegSexo(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="regHasTitle"
                        checked={regHasTitle}
                        onChange={(e) => setRegHasTitle(e.target.checked)}
                        className="rounded border-slate-800 text-blue-600 focus:ring-0 bg-slate-900"
                      />
                      <label htmlFor="regHasTitle" className="text-[10px] text-slate-400 font-semibold cursor-pointer">
                        Declaro presentar y adjuntar copia en físico de mi TÍTULO DE BACHILLER u otros documentos autorizados.
                      </label>
                    </div>

                    <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-xl mt-2 text-[10.5px] text-slate-350 leading-relaxed">
                      💡 <strong>Derecho de Inscripción obligatoria:</strong> Al crear su cuenta, se le asignará una cuenta por pagar de <strong>700 Bs.</strong> que podrá transferir, pagar vía QR o tarjeta para la posterior debida verificación administrativa de pagos.
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-black uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all border border-emerald-500 shadow-lg mt-2 shadow-emerald-500/10"
                >
                  Registrar Cuenta e Iniciar Sesión en Sistema
                </button>
              </form>
            )}
          </div>
            </>
          )}
        </div>

        {/* Quick Access panel has been removed */}

      </div>

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 relative overflow-hidden text-left text-white">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500"></div>
            
            <div className="flex justify-between items-start">
              <h3 className="font-sans font-black text-xs uppercase tracking-widest text-blue-400">
                Recuperación de Contraseña
              </h3>
              <button 
                type="button" 
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold font-sans cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Ingrese su correo electrónico, Registro Académico o C.I. para recuperar su contraseña mediante WhatsApp.
            </p>

            <form onSubmit={handleSearchRecovery} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-black tracking-widest text-slate-500">Buscar Usuario:</label>
                <input
                  type="text"
                  required
                  placeholder="ej: mateo.sandoval@gmail.com o 226040101"
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {recoveryError && (
                <p className="text-rose-400 text-[10px] font-bold font-sans">{recoveryError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-sans font-black uppercase tracking-wider py-2.5 rounded-lg transition-all cursor-pointer"
              >
                Buscar Registro
              </button>
            </form>

            {foundUser && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mt-2">
                <div className="text-[10px] text-slate-400 space-y-1 font-sans">
                  <p><strong>Nombre Completo:</strong> {foundUser.nombre_completo}</p>
                  <p><strong>Rol:</strong> {foundUser.rol}</p>
                  {foundUser.rol === Rol.Estudiante ? (
                    <p><strong>Celular Registrado:</strong> +591 {foundCelular}</p>
                  ) : (
                    <p><strong>Soporte Administrativo:</strong> +591 70000000</p>
                  )}
                </div>

                {foundUser.rol === Rol.Estudiante ? (
                  <a
                    href={`https://wa.me/591${foundCelular}?text=Hola%20${encodeURIComponent(foundUser.nombre_completo)},%20su%20contraseña%20de%20acceso%20al%20sistema%20CUP%20es:%20${encodeURIComponent(foundUser.password || 'estudiante123')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-full block text-center bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-sans font-black uppercase tracking-wider py-2.5 rounded-lg transition-all"
                  >
                    Enviar Contraseña por WhatsApp
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/59170000000?text=Hola,%20solicito%20soporte%20para%20la%20recuperación%20de%20mi%20contraseña%20de%20${encodeURIComponent(foundUser.rol)}.%20Mi%20nombre%20es%20${encodeURIComponent(foundUser.nombre_completo)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-full block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-sans font-black uppercase tracking-wider py-2.5 rounded-lg transition-all"
                  >
                    Contactar Soporte Técnico UAGRM
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
