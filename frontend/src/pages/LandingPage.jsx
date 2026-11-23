// frontend/src/pages/LandingPage.jsx
export default function LandingPage({ onAccederIntranet }) {
  const irASeccion = (e, idSeccion) => {
    e.preventDefault();
    const elemento = document.getElementById(idSeccion);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const manejarErrorImagen = (e) => {
    // Oculta la imagen si aún no existe el archivo en public/images/institucion/
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Identidad Institucional */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center font-extrabold text-sm tracking-tight shadow-sm shrink-0">
              30216
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Institución Educativa Pública
              </p>
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                I.E. N.° 30216 "Sagrado Corazón de María"
              </h1>
            </div>
          </div>

          {/* Enlaces rápidos (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={(e) => irASeccion(e, 'nosotros')}
              className="hover:text-blue-700 transition cursor-pointer"
            >
              Nosotros
            </button>
            <button
              type="button"
              onClick={(e) => irASeccion(e, 'propuesta')}
              className="hover:text-blue-700 transition cursor-pointer"
            >
              Propuesta Educativa
            </button>
            <button
              type="button"
              onClick={(e) => irASeccion(e, 'galeria')}
              className="hover:text-blue-700 transition cursor-pointer"
            >
              Instalaciones
            </button>
            <button
              type="button"
              onClick={(e) => irASeccion(e, 'contacto')}
              className="hover:text-blue-700 transition cursor-pointer"
            >
              Contacto
            </button>
          </nav>

          {/* Botón Esquina Superior Derecha */}
          <a
            href="#/intranet"
            onClick={(e) => {
              e.preventDefault();
              onAccederIntranet();
            }}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer shrink-0"
          >
            <span>Accede a la Intranet</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </header>

      {/* Hero Principal */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-800/80 text-blue-100 border border-blue-700">
              Educación Primaria • Huancayo, Junín
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Formando estudiantes íntegros con valores, ciencia y compromiso ciudadano
            </h2>

            <p className="text-blue-100 text-base sm:text-lg max-w-2xl leading-relaxed">
              En la Institución Educativa N.° 30216 "Sagrado Corazón de María" brindamos una
              formación integral centrada en el desarrollo de competencias del Currículo Nacional,
              promoviendo la convivencia democrática y el acompañamiento cercano a cada familia.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onAccederIntranet}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm sm:text-base shadow-md transition cursor-pointer"
              >
                Ingresar a la Plataforma Académica
              </button>
              <button
                type="button"
                onClick={(e) => irASeccion(e, 'nosotros')}
                className="px-5 py-3 rounded-xl text-sm sm:text-base font-medium border border-blue-400/40 text-white hover:bg-white/10 transition cursor-pointer"
              >
                Conocer la Institución
              </button>
            </div>
          </div>

          {/* Tarjeta Resumen + Foto Destacada en el Hero */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl overflow-hidden shadow-xl">
              <div className="relative h-48 bg-blue-950/60 flex items-center justify-center">
                <span className="text-xs text-blue-200/80 px-4 text-center">
                  Coloca tu foto principal en <code className="text-amber-300">public/images/institucion/hero.jpg</code>
                </span>
                <img
                  src="/images/institucion/hero.jpg"
                  alt='Vista principal de la I.E. N.° 30216 "Sagrado Corazón de María"'
                  onError={manejarErrorImagen}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-7 space-y-4">
                <div className="border-b border-white/15 pb-3">
                  <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                    Ficha Institucional
                  </p>
                  <h3 className="text-lg font-bold mt-0.5">Datos Generales</h3>
                </div>

                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-blue-200">Nivel Educativo:</dt>
                    <dd className="font-semibold text-right">Educación Primaria (1.° a 6.° Grado)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-blue-200">Gestión:</dt>
                    <dd className="font-semibold text-right">Pública - UGEL Huancayo</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-blue-200">Modalidad:</dt>
                    <dd className="font-semibold text-right">Educación Básica Regular (EBR)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-blue-200">Ubicación:</dt>
                    <dd className="font-semibold text-right">Huancayo, Junín - Perú</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Nosotros: Misión, Visión y Valores */}
      <section id="nosotros" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Identidad Institucional
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Nuestra Misión, Visión y Compromiso
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Trabajamos articuladamente entre directivos, docentes, personal administrativo y
              padres de familia para garantizar aprendizajes significativos en un entorno seguro e inclusivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                M
              </div>
              <h3 className="text-lg font-bold text-slate-900">Misión</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Lograr que todas y todos los estudiantes culminen su educación primaria afianzando
                sus aprendizajes fundamentales, practicando valores éticos y desarrollando autonomía
                en espacios seguros y saludables.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                V
              </div>
              <h3 className="text-lg font-bold text-slate-900">Visión</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ser una institución educativa referente en Huancayo por su calidad pedagógica,
                innovación digital en la gestión escolar y formación ciudadana con identidad cultural
                y respeto por el entorno.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                ✦
              </div>
              <h3 className="text-lg font-bold text-slate-900">Valores Institucionales</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>• Respeto y empatía en la convivencia escolar</li>
                <li>• Responsabilidad y perseverancia académica</li>
                <li>• Honestidad, solidaridad y trabajo en equipo</li>
                <li>• Identidad regional y cuidado ambiental</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Propuesta Educativa */}
      <section id="propuesta" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Formación Integral
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Propuesta Educativa por Ciclos
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Evaluación formativa por bimestres bajo el enfoque del Currículo Nacional de la
              Educación Básica (CNEB).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                III Ciclo • 1.° y 2.° Grado
              </span>
              <h3 className="text-base font-bold text-slate-900 pt-2">
                Iniciación en Lectoescritura y Pensamiento Lógico
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Consolidación de la comunicación oral y escrita, nociones matemáticas básicas y
                habilidades socioemocionales en un ambiente cálido.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700">
                IV Ciclo • 3.° y 4.° Grado
              </span>
              <h3 className="text-base font-bold text-slate-900 pt-2">
                Comprensión Crítica e Indagación Científica
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fortalecimiento de la comprensión lectora, resolución de problemas cotidianos,
                curiosidad científica y participación activa en el aula.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                V Ciclo • 5.° y 6.° Grado
              </span>
              <h3 className="text-base font-bold text-slate-900 pt-2">
                Autonomía, Ciudadanía y Preparación para Secundaria
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Desarrollo del pensamiento crítico, competencias digitales, liderazgo estudiantil
                y hábitos de estudio autónomos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Galería de Instalaciones y Vida Escolar */}
      <section id="galeria" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Vida Institucional
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Nuestros Espacios y Actividades
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Guarda tus fotografías en <code className="text-slate-800">frontend/public/images/institucion/</code> con los nombres indicados abajo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                src: '/images/institucion/fachada.jpg',
                titulo: 'Infraestructura y Patio Escolar',
                desc: 'Espacios seguros y organizados para el desarrollo de las jornadas escolares.',
                archivo: 'fachada.jpg',
              },
              {
                src: '/images/institucion/aulas.jpg',
                titulo: 'Aulas de Aprendizaje',
                desc: 'Entornos adecuados para el trabajo colaborativo y el acompañamiento docente.',
                archivo: 'aulas.jpg',
              },
              {
                src: '/images/institucion/actividades.jpg',
                titulo: 'Actividades Cívicas y Culturales',
                desc: 'Participación estudiantil que fortalece la identidad y los valores institucionales.',
                archivo: 'actividades.jpg',
              },
            ].map((item) => (
              <div
                key={item.archivo}
                className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs flex flex-col"
              >
                <div className="relative h-48 bg-slate-200 flex items-center justify-center p-4 text-center">
                  <span className="text-xs text-slate-500">
                    Imagen pendiente: <strong>{item.archivo}</strong>
                  </span>
                  <img
                    src={item.src}
                    alt={item.titulo}
                    onError={manejarErrorImagen}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{item.titulo}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Servicios y Ecosistema Digital */}
      <section id="servicios" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Gestión Moderna y Transparente
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Servicios de Nuestra Intranet Institucional
              </h2>
            </div>
            <button
              type="button"
              onClick={onAccederIntranet}
              className="self-start md:self-auto text-sm font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              Ir al acceso de usuarios →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Seguimiento Académico</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consulta de calificaciones por bimestre, evaluaciones y libretas de información
                en línea para estudiantes y familias.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Control de Asistencia</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registro diario por aula y visualización oportuna de asistencias, tardanzas y
                justificaciones.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Comunicados e Incidencias</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Canal oficial entre dirección, docentes y aulas para avisos institucionales y
                acompañamiento conductual.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Mesa de Partes y Trámites</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Recepción y seguimiento con número de expediente para documentos externos y
                solicitudes internas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Contacto y Horarios */}
      <section id="contacto" className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Ubicación
            </h3>
            <p className="text-sm text-slate-600">
              Distrito y Provincia de Huancayo, Departamento de Junín - Perú.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Horario de Atención
            </h3>
            <p className="text-sm text-slate-600">
              Lunes a Viernes: 8:00 a. m. – 1:00 p. m.
              <br />
              Mesa de Partes y Secretaría Académica.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Comunidad Educativa
            </h3>
            <p className="text-sm text-slate-600">
              ¿Eres directivo, docente, administrativo o estudiante?
            </p>
            <button
              type="button"
              onClick={onAccederIntranet}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              Accede a la Intranet aquí →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>
            © {new Date().getFullYear()} I.E. N.° 30216 "Sagrado Corazón de María" — Todos los derechos reservados.
          </p>
          <p className="text-slate-500">Portal Institucional y Plataforma Académica</p>
        </div>
      </footer>
    </div>
  );
}