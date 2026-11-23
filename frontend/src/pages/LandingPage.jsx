// frontend/src/pages/LandingPage.jsx
import { useEffect, useState } from 'react';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  Bars3Icon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ComputerDesktopIcon,
  HeartIcon,
  LightBulbIcon,
  MapPinIcon,
  PhotoIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  AcademicCapIcon as AcademicCapSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  HeartIcon as HeartSolid,
  LightBulbIcon as LightBulbSolid,
  ScaleIcon as ScaleSolid,
  ShieldCheckIcon as ShieldCheckSolid,
  SparklesIcon as SparklesSolid,
  TrophyIcon as TrophySolid,
  UserGroupIcon as UserGroupSolid,
} from '@heroicons/react/24/solid';

const FOTOS_INSTITUCION = [
  {
    src: '/images/institucion/fachada.jpg',
    archivo: 'fachada.jpg',
    badge: 'Nuestro Segundo Hogar',
    titulo: 'Un espacio diseñado para crecer y soñar',
    descripcion:
      'Nuestra sede en Jr. Antonio Lobato N.° 799, El Tambo, recibe cada día a estudiantes y familias de este distrito y zonas cercanas como Pilcomayo, Sicaya, Huancayo, Huáchac, Huamancaca Chico y Chilca.',
    IconoOutline: BuildingLibraryIcon,
    IconoSolid: TrophySolid,
  },
  {
    src: '/images/institucion/aulas.jpg',
    archivo: 'aulas.jpg',
    badge: 'Pasión por la Lectura',
    titulo: 'Donde las letras y las ideas cobran vida',
    descripcion:
      'Aulas orientadas a comprender lo que leemos y a resolver retos cotidianos, respaldadas por nuestro primer puesto nacional en "El Perú Lee" (2024) y el cuarto lugar local en 2023.',
    IconoOutline: AcademicCapIcon,
    IconoSolid: AcademicCapSolid,
  },
  {
    src: '/images/institucion/biohuerto.jpg',
    archivo: 'biohuerto.jpg',
    badge: 'Manos a la Tierra',
    titulo: 'Conectando con la naturaleza',
    descripcion:
      'Nuestro biohuerto, áreas verdes y brigadas ecológicas enseñan a cuidar la tierra y convivir con respeto hacia el medio ambiente.',
    IconoOutline: SparklesIcon,
    IconoSolid: SparklesSolid,
  },
  {
    src: '/images/institucion/deportes.jpg',
    archivo: 'deportes.jpg',
    badge: 'Energía en Movimiento',
    titulo: 'Deporte, salud y compañerismo',
    descripcion:
      'Practicamos vóley, futsal y educación física para fortalecer la salud, el orden, la disciplina y el juego limpio en equipo.',
    IconoOutline: TrophyIcon,
    IconoSolid: TrophySolid,
  },
  {
    src: '/images/institucion/comunidad.jpg',
    archivo: 'comunidad.jpg',
    badge: 'Arte y Participación',
    titulo: 'Expresando nuestro mundo interior',
    descripcion:
      'Concursos de declamación y villancicos que reúnen a directivos, docentes, personal, consejo educativo, municipio escolar y familias.',
    IconoOutline: UserGroupIcon,
    IconoSolid: UserGroupSolid,
  },
];

const CICLOS_PEDAGOGICOS = [
  {
    id: 'ciclo3',
    etiqueta: '1.° y 2.° Grado',
    titulo: 'Descubrimiento y Primeras Letras',
    resumen:
      'Acompañamos con cercanía los primeros pasos en lectura, expresión oral, matemática básica y hábitos diarios como la puntualidad y el orden.',
    Icono: SparklesSolid,
    color: 'from-sky-400 to-sky-300',
    enfasis: ['Lectura y expresión', 'Matemática inicial', 'Puntualidad y afecto'],
  },
  {
    id: 'ciclo4',
    etiqueta: '3.° y 4.° Grado',
    titulo: 'Curiosidad, Lógica y Naturaleza',
    resumen:
      'Fortalecemos la comprensión lectora, la resolución de problemas y la participación activa en el cuidado ambiental y la buena convivencia.',
    Icono: LightBulbSolid,
    color: 'from-blue-500 to-sky-400',
    enfasis: ['Comprensión lectora', 'Resolución de problemas', 'Cuidado ambiental'],
  },
  {
    id: 'ciclo5',
    etiqueta: '5.° y 6.° Grado',
    titulo: 'Autonomía y Ciudadanía Digital',
    resumen:
      'Impulsamos el estudio autónomo, la opinión fundamentada, el uso responsable de la tecnología y el liderazgo en el municipio escolar y brigadas.',
    Icono: ShieldCheckSolid,
    color: 'from-blue-900 to-blue-700',
    enfasis: ['Aprendizaje autónomo', 'Uso de tecnología', 'Liderazgo escolar'],
  },
];

const VALORES_INSTITUCIONALES = [
  {
    id: 'ambiental',
    nombre: 'Conciencia Ambiental',
    resumen:
      'Cuidamos y protegemos nuestro entorno, el biohuerto y los espacios comunes con hábitos sostenibles en el día a día.',
    IconoOutline: SparklesIcon,
    IconoSolid: SparklesSolid,
  },
  {
    id: 'respeto',
    nombre: 'Respeto',
    resumen:
      'Valoramos la dignidad y los derechos de cada persona; la puntualidad es parte esencial del respeto y del buen aprovechamiento del tiempo.',
    IconoOutline: ShieldCheckIcon,
    IconoSolid: ShieldCheckSolid,
  },
  {
    id: 'tolerancia',
    nombre: 'Tolerancia',
    resumen:
      'Acogemos la diversidad de opiniones, costumbres y formas de ser, construyendo un ambiente sin prejuicios ni exclusión.',
    IconoOutline: ChatBubbleLeftRightIcon,
    IconoSolid: ChatSolid,
  },
  {
    id: 'responsabilidad',
    nombre: 'Responsabilidad',
    resumen:
      'Cumplimos con nuestras tareas y compromisos escolares y asumimos con madurez las consecuencias de lo que hacemos.',
    IconoOutline: ClipboardDocumentCheckIcon,
    IconoSolid: ScaleSolid,
  },
  {
    id: 'inclusion',
    nombre: 'Inclusión',
    resumen:
      'Brindamos un trato justo y accesible para que todos los estudiantes participen y aprendan en igualdad de oportunidades.',
    IconoOutline: HeartIcon,
    IconoSolid: HeartSolid,
  },
  {
    id: 'creatividad',
    nombre: 'Creatividad e Innovación',
    resumen:
      'Animamos a imaginar nuevas ideas y poner en práctica soluciones útiles que mejoren el aprendizaje y la vida en la escuela.',
    IconoOutline: LightBulbIcon,
    IconoSolid: LightBulbSolid,
  },
];

const PILARES_GESTION = [
  {
    codigo: 'Aprendizajes',
    titulo: 'Crecimiento Académico y Continuidad',
    descripcion:
      'Trabajamos para que más estudiantes alcancen buenos logros en Lectura y Matemática y concluyan su etapa escolar sin interrupciones.',
    Icono: AcademicCapIcon,
    avance: '78%',
  },
  {
    codigo: 'Espacios',
    titulo: 'Organización y Entorno Seguro',
    descripcion:
      'Cuidamos el calendario escolar, la matrícula abierta, el registro de asistencia y las mejoras constantes en aulas, mobiliario y biohuerto.',
    Icono: BuildingLibraryIcon,
    avance: '85%',
  },
  {
    codigo: 'Aula',
    titulo: 'Acompañamiento Docente y Tecnología',
    descripcion:
      'Fomentamos el trabajo en equipo de los maestros, el apoyo oportuno a quien lo necesita y el uso educativo de herramientas digitales.',
    Icono: ClipboardDocumentCheckIcon,
    avance: '72%',
  },
  {
    codigo: 'Convivencia',
    titulo: 'Bienestar y Participación de Todos',
    descripcion:
      'Fortalecemos la tutoría, el cuidado emocional y el trabajo conjunto con familias, consejo educativo, municipio escolar y brigadas.',
    Icono: UserGroupIcon,
    avance: '80%',
  },
];

const NAV_ITEMS = [
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'vida-escolar', label: 'Vida Escolar' },
  { id: 'pedagogia', label: 'Educación' },
  { id: 'gestion', label: 'Gestión' },
  { id: 'contacto', label: 'Contacto' },
];

export default function LandingPage({ onAccederIntranet }) {
  const [slideActivo, setSlideActivo] = useState(0);
  const [valorSeleccionado, setValorSeleccionado] = useState('ambiental');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modalGaleriaAbierto, setModalGaleriaAbierto] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (modalGaleriaAbierto) return;
    const intervalo = setInterval(() => {
      setSlideActivo((prev) => (prev === FOTOS_INSTITUCION.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalo);
  }, [modalGaleriaAbierto]);

  const ocultarSiNoExiste = (e) => {
    e.currentTarget.style.display = 'none';
    if (e.currentTarget.parentElement) {
      e.currentTarget.parentElement.classList.add('bg-slate-200');
    }
  };

  const irASeccion = (e, id) => {
    e.preventDefault();
    setMenuAbierto(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const fotoActual = FOTOS_INSTITUCION[slideActivo];
  const CurrentIcon = fotoActual.IconoSolid;
  const valorActivo =
    VALORES_INSTITUCIONALES.find((v) => v.id === valorSeleccionado) || VALORES_INSTITUCIONALES[0];
  const IconoValorActivo = valorActivo.IconoSolid;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-sky-200 overflow-x-hidden">
      {/* NAVBAR FLOTANTE */}
      <div className="fixed top-0 left-0 w-full z-50 flex justify-center pt-4 px-4 pointer-events-none">
        <header
          className={`pointer-events-auto flex items-center justify-between w-full max-w-6xl px-4 sm:px-6 py-3 rounded-full transition-all duration-500 ${
            scrolled
              ? 'bg-white/85 backdrop-blur-xl shadow-lg border border-white/50 shadow-blue-900/5'
              : 'bg-white/95 shadow-md border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-950 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <BuildingLibraryIcon className="w-5 h-5" />
            </div>
            <div className="hidden sm:block truncate">
              <p className="text-[10px] font-extrabold tracking-widest uppercase text-sky-600 leading-none">
                El Tambo • Huancayo • Cód. 0382135
              </p>
              <h1 className="text-sm font-black text-blue-950 leading-tight truncate">
                I.E. N.° 30216 "Sagrado Corazón de María"
              </h1>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-5 bg-slate-100/70 px-5 py-2 rounded-full border border-slate-200/60">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => irASeccion(e, item.id)}
                className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onAccederIntranet}
              className="group relative inline-flex items-center justify-center px-5 py-2.5 font-bold text-white transition-all duration-300 bg-blue-950 rounded-full hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/30 overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2 text-xs sm:text-sm">
                Intranet
                <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-label="Abrir menú"
              className="lg:hidden w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
            >
              {menuAbierto ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </header>
      </div>

      {/* Menú Móvil Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-blue-950/95 backdrop-blur-md transition-opacity duration-300 lg:hidden flex flex-col justify-center items-center gap-7 ${
          menuAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => irASeccion(e, item.id)}
            className="text-2xl font-black text-white hover:text-sky-400 transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] pt-32 pb-36 flex flex-col items-center justify-center overflow-hidden bg-blue-950 rounded-b-[3rem] sm:rounded-b-[5rem] z-10">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/institucion/hero.jpg"
            alt='I.E. N.° 30216 "Sagrado Corazón de María"'
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.classList.add(
                'bg-gradient-to-br',
                'from-blue-950',
                'via-blue-900',
                'to-slate-900'
              );
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/65 to-transparent" />
          <div className="absolute top-20 -left-20 w-96 h-96 bg-sky-500/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-20 -right-20 w-[30rem] h-[30rem] bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-7">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-300 text-xs sm:text-sm font-semibold tracking-wide">
            <SparklesSolid className="w-4 h-4 text-sky-400" />
            <span>Educación Primaria • El Tambo, Huancayo • Local 222968</span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight drop-shadow-lg bg-gradient-to-r from-sky-300 via-sky-100 to-white bg-clip-text text-transparent">
            Educamos con el corazón, lideramos con el ejemplo.
          </h2>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-blue-100/90 font-medium leading-relaxed">
            Formación cercana y de calidad para niños y niñas de El Tambo y lugares vecinos.
            Crecemos juntos con valores, respeto por la naturaleza, convivencia sana y herramientas
            digitales.
          </p>

          {/* Comunidad Educativa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2 text-left">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="flex items-center justify-between text-sky-300 text-xs font-bold uppercase">
                <span>Estudiantes</span>
                <UserGroupIcon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white mt-1">536</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="flex items-center justify-between text-sky-300 text-xs font-bold uppercase">
                <span>Docentes</span>
                <AcademicCapIcon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white mt-1">33</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="flex items-center justify-between text-sky-300 text-xs font-bold uppercase">
                <span>Directivos</span>
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white mt-1">3</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="flex items-center justify-between text-sky-300 text-xs font-bold uppercase">
                <span>Administrativos</span>
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white mt-1">4</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={(e) => irASeccion(e, 'nosotros')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-sky-400 hover:bg-sky-300 text-blue-950 font-extrabold transition-all hover:scale-105 shadow-[0_0_40px_rgba(56,189,248,0.3)] cursor-pointer"
            >
              Descubre nuestra escuela
            </button>
            <button
              type="button"
              onClick={() => setModalGaleriaAbierto(true)}
              className="w-full sm:w-auto group px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhotoIcon className="w-5 h-5 text-sky-300" />
              <span>Ver galería</span>
            </button>
          </div>
        </div>
      </section>

      {/* WIDGETS FLOTANTES SOBRE EL BORDE DEL HERO */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex items-start gap-5 group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <TrophySolid className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Campeones Nacionales</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Primer lugar nacional en "El Perú Lee" 2024 y cuarto puesto local en 2023. Aquí
                leer y expresarse es parte de cada día.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex items-start gap-5 group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <AcademicCapSolid className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Educación Integral</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Aprendizaje colaborativo, uso educativo de la tecnología, declamación, villancicos,
                vóley y futsal en turnos de mañana y tarde.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex items-start gap-5 group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <SparklesSolid className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Espacios Vivos</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Biohuerto, plantas y brigadas ecológicas que acercan a los estudiantes al cuidado
                real de la naturaleza.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN NOSOTROS (COLLAGE EDITORIAL Y ASIMÉTRICO) */}
      <section id="nosotros" className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative h-[500px] lg:h-[600px] w-full">
            <div className="absolute top-0 left-0 w-3/4 h-3/4 rounded-[2rem] overflow-hidden shadow-2xl z-10 border-4 border-white">
              <img
                src="/images/institucion/fachada.jpg"
                alt="Institución"
                className="w-full h-full object-cover"
                onError={ocultarSiNoExiste}
              />
              <div className="absolute inset-0 bg-blue-950/10 mix-blend-multiply" />
            </div>
            <div className="absolute bottom-0 right-0 w-3/5 h-2/5 rounded-[2rem] overflow-hidden shadow-2xl z-20 border-4 border-white translate-x-4 translate-y-4 hover:scale-105 transition-transform duration-500">
              <img
                src="/images/institucion/aulas.jpg"
                alt="Aulas"
                className="w-full h-full object-cover"
                onError={ocultarSiNoExiste}
              />
            </div>
            <div className="absolute top-1/2 -left-4 sm:-left-6 z-30 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-sky-500 leading-none">2028</span>
              <span className="text-xs font-bold text-blue-950 uppercase tracking-widest mt-1">
                Horizonte
              </span>
            </div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-400/20 to-transparent blur-xl z-0" />
          </div>

          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase">
              <HeartSolid className="w-4 h-4" />
              <span>Nuestra Esencia</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
              Más que una escuela,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-500">
                somos una familia.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              En el corazón de El Tambo, nuestra escuela acompaña a niños y niñas de este distrito y
              de zonas vecinas como Pilcomayo, Sicaya, Huancayo, Huáchac, Huamancaca Chico y
              Chilca, sumando fuerzas con las familias, el consejo educativo, el municipio escolar y
              las brigadas.
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-4 items-start group hover:border-sky-300 transition-colors">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <LightBulbSolid className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Cómo Queremos Crecer</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Impulsamos mejores aprendizajes mediante el trabajo en equipo y el vínculo con
                    nuestro entorno ambiental y cultural, formando estudiantes críticos, creativos e
                    inclusivos, con valores, bienestar emocional, convivencia sana y buen uso de la
                    tecnología.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-4 items-start group hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <ShieldCheckSolid className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Nuestro Compromiso Hacia el 2028</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Acompañar a cada estudiante para que afronte los retos ambientales y sociales de
                    su comunidad con criterio propio, creatividad, inclusión, ética, autonomía,
                    habilidades emocionales y uso responsable de las herramientas digitales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER INTERACTIVO DE VALORES */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 py-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
            {VALORES_INSTITUCIONALES.map((val) => {
              const activa = val.id === valorSeleccionado;
              const IconoItem = activa ? val.IconoSolid : val.IconoOutline;
              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => setValorSeleccionado(val.id)}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activa
                      ? 'bg-sky-400 text-blue-950 shadow-lg scale-105'
                      : 'bg-white/10 text-white/85 hover:bg-white/15 hover:text-sky-300 border border-white/15'
                  }`}
                >
                  <IconoItem className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>{val.nombre}</span>
                </button>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-6 py-4 text-center text-blue-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <IconoValorActivo className="w-5 h-5 text-sky-300 shrink-0" />
            <p className="text-sm">
              <strong className="text-white">{valorActivo.nombre}:</strong> {valorActivo.resumen}
            </p>
          </div>
        </div>
      </section>

      {/* CARRUSEL INMERSIVO + GRID EXTRA DE FOTOS */}
      <section id="vida-escolar" className="py-24 bg-white relative">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              El día a día en nuestras aulas
            </h2>
            <p className="text-lg text-slate-500">
              Un vistazo a los espacios, logros y actividades donde crece nuestra comunidad.
            </p>
          </div>

          <div className="relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl h-[480px] lg:h-[620px] flex items-center justify-center group">
            <img
              key={fotoActual.archivo}
              src={fotoActual.src}
              alt={fotoActual.titulo}
              onError={ocultarSiNoExiste}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-70 group-hover:scale-105 group-hover:opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/45 to-transparent" />

            <div className="relative z-10 bottom-0 left-0 w-full px-6 sm:px-12 md:px-20 pb-10 sm:pb-14 mt-auto text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/90 text-white text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                <CurrentIcon className="w-4 h-4" />
                <span>{fotoActual.badge}</span>
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-md mb-3 max-w-3xl">
                {fotoActual.titulo}
              </h3>
              <p className="text-blue-100 text-base sm:text-xl max-w-2xl drop-shadow">
                {fotoActual.descripcion}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSlideActivo((prev) => (prev === 0 ? FOTOS_INSTITUCION.length - 1 : prev - 1))
              }
              aria-label="Foto anterior"
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-blue-950 transition-colors z-20 cursor-pointer"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() =>
                setSlideActivo((prev) => (prev === FOTOS_INSTITUCION.length - 1 ? 0 : prev + 1))
              }
              aria-label="Siguiente foto"
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-blue-950 transition-colors z-20 cursor-pointer"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Miniaturas tipo Píldora */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {FOTOS_INSTITUCION.map((item, idx) => (
              <button
                key={item.archivo}
                type="button"
                onClick={() => setSlideActivo(idx)}
                className={`relative h-16 w-32 sm:w-40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                  idx === slideActivo
                    ? 'ring-4 ring-sky-400 scale-105 shadow-lg'
                    : 'opacity-65 hover:opacity-100'
                }`}
              >
                <img
                  src={item.src}
                  className="w-full h-full object-cover"
                  alt={item.titulo}
                  onError={ocultarSiNoExiste}
                />
                <div
                  className={`absolute inset-0 bg-blue-900/30 ${
                    idx === slideActivo ? 'bg-transparent' : ''
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Tarjetas de Espacios Adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {FOTOS_INSTITUCION.slice(2).map((item, index) => {
              const IconoCard = item.IconoOutline;
              const slideIndex = index + 2;
              return (
                <button
                  key={item.archivo}
                  type="button"
                  onClick={() => setSlideActivo(slideIndex)}
                  className="text-left rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-lg transition-all flex flex-col cursor-pointer group"
                >
                  <div className="relative h-44 w-full bg-slate-200 flex items-center justify-center">
                    <span className="text-xs font-mono text-slate-600">{item.archivo}</span>
                    <img
                      src={item.src}
                      alt={item.titulo}
                      onError={ocultarSiNoExiste}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                      <IconoCard className="w-4 h-4" />
                      <span>{item.badge}</span>
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{item.titulo}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.descripcion}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROPUESTA PEDAGÓGICA (TARJETAS ESCALONADAS POR CICLOS) */}
      <section id="pedagogia" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-sky-100/50 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:flex md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-sky-600 font-bold uppercase tracking-widest text-sm mb-2">
                Educación por Etapas
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
                Metodología que se adapta a su crecimiento
              </h2>
            </div>
            <p className="text-slate-600 mt-4 md:mt-0 max-w-md text-sm sm:text-base leading-relaxed">
              Aprendemos conversando, compartiendo ideas y construyendo juntos, integrando
              lectura, resolución de problemas, cuidado ambiental, emociones y tecnología.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CICLOS_PEDAGOGICOS.map((ciclo) => (
              <div
                key={ciclo.id}
                className="group relative bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col h-full"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${ciclo.color} opacity-10 rounded-bl-[100px] transition-all group-hover:scale-150 group-hover:opacity-20`}
                />

                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ciclo.color} flex items-center justify-center text-white mb-6 shadow-md`}
                >
                  <ciclo.Icono className="w-7 h-7" />
                </div>

                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  {ciclo.etiqueta}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">
                  {ciclo.titulo}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">{ciclo.resumen}</p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {ciclo.enfasis.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={(e) => irASeccion(e, 'gestion')}
                  className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-blue-700 group-hover:text-sky-600 transition-colors cursor-pointer"
                >
                  <span>Ver cómo gestionamos</span>
                  <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GESTIÓN ESCOLAR Y PARTICIPACIÓN */}
      <section id="gestion" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
                Organización y Comunidad
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                Liderazgo cercano y participación de todos
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Cada avance nace del trabajo conjunto entre directivos, docentes, personal
                administrativo, familias, consejo educativo, municipio escolar, policía escolar,
                brigadas y aliados de la comunidad.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILARES_GESTION.map((pilar) => {
              const IconoPilar = pilar.Icono;
              return (
                <div
                  key={pilar.codigo}
                  className="rounded-3xl bg-slate-50 border border-slate-200/80 p-6 flex flex-col justify-between space-y-4 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-blue-950 text-white">
                        <IconoPilar className="w-4 h-4 text-sky-300" />
                        <span>{pilar.codigo}</span>
                      </span>
                      <span className="text-xs font-extrabold text-sky-700">{pilar.avance}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{pilar.titulo}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{pilar.descripcion}</p>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-800 to-sky-500 rounded-full"
                      style={{ width: pilar.avance }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BANNER DE CONTACTO Y ACCESO (DISEÑO SPLIT) */}
      <section id="contacto" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-950 rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
            <div className="w-full lg:w-5/12 bg-gradient-to-br from-blue-900 to-blue-950 p-10 sm:p-14 flex flex-col justify-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 blur-[80px] rounded-full" />
              <h3 className="text-3xl sm:text-4xl font-black mb-8 relative z-10">
                Las puertas están abiertas
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <MapPinIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-sky-300 font-bold">
                      Ubicación Central
                    </p>
                    <p className="text-lg font-semibold mt-1">Jr. Antonio Lobato N.° 799</p>
                    <p className="text-sm text-blue-200">
                      El Tambo, Huancayo, Junín • Cód. 0382135
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <CalendarDaysIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-sky-300 font-bold">
                      Atención Escolar
                    </p>
                    <p className="text-lg font-semibold mt-1">Turnos Mañana y Tarde</p>
                    <p className="text-sm text-blue-200">
                      Educación Primaria • Local 222968
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-7/12 bg-sky-500 p-10 sm:p-14 flex flex-col justify-center relative overflow-hidden text-blue-950">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />

              <div className="relative z-10 space-y-6 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 text-white text-xs font-bold uppercase tracking-wider">
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <span>Plataforma Digital</span>
                </div>
                <h3 className="text-4xl font-black leading-tight">
                  Acceso a la Intranet Institucional
                </h3>
                <p className="text-blue-950/85 text-lg font-medium">
                  Consulta y gestiona salones, asistencia, calificaciones, comunicados e
                  incidencias de forma rápida y ordenada.
                </p>
                <button
                  type="button"
                  onClick={onAccederIntranet}
                  className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                >
                  <ShieldCheckSolid className="w-5 h-5" />
                  <span>Iniciar Sesión Segura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL DE GALERÍA */}
      {modalGaleriaAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
                  public/images/institucion/
                </p>
                <h3 className="text-xl font-black text-slate-900">
                  Galería — I.E. N.° 30216 "Sagrado Corazón de María"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalGaleriaAbierto(false)}
                aria-label="Cerrar galería"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FOTOS_INSTITUCION.map((foto, idx) => (
                <button
                  key={foto.archivo}
                  type="button"
                  onClick={() => {
                    setSlideActivo(idx);
                    setModalGaleriaAbierto(false);
                    document.getElementById('vida-escolar')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-left rounded-2xl border border-slate-200 overflow-hidden hover:border-sky-400 transition cursor-pointer bg-slate-50"
                >
                  <div className="relative h-36 bg-slate-200 flex items-center justify-center p-3 text-center">
                    <span className="text-xs font-mono text-slate-600">{foto.archivo}</span>
                    <img
                      src={foto.src}
                      alt={foto.titulo}
                      onError={ocultarSiNoExiste}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-sky-700">{foto.badge}</p>
                    <p className="text-xs font-bold text-slate-900">{foto.titulo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t-4 border-sky-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <BuildingLibraryIcon className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                I.E. N.° 30216 "Sagrado Corazón de María"
              </p>
              <p className="text-xs mt-1">
                Jr. Antonio Lobato N.° 799, El Tambo, Huancayo • Cód. 0382135 / Local 222968
              </p>
            </div>
          </div>
          <div className="text-xs space-y-1 font-medium">
            <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
            <p>El Tambo, Huancayo — Educación Pública</p>
          </div>
        </div>
      </footer>
    </div>
  );
}