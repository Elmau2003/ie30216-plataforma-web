// backend/seed.js
const db = require('./db');
const bcrypt = require('bcryptjs');

const crearUsuarioDirectivoInicial = async () => {
  try {
    // 1. Obtener el ID del rol DIRECTIVO
    const rolRes = await db.query("SELECT id FROM roles WHERE nombre = 'DIRECTIVO'");
    if (rolRes.rows.length === 0) {
      console.error('El rol DIRECTIVO no existe en la base de datos.');
      process.exit(1);
    }
    const rolDirectivoId = rolRes.rows[0].id;

    // 2. Datos del usuario Administrador / Directivo inicial
    const dni = '00000000'; // DNI de acceso inicial
    const passwordOriginal = 'admin123';
    const passwordHash = await bcrypt.hash(passwordOriginal, 10);

    // 3. Insertar o verificar si ya existe
    const existeUser = await db.query('SELECT id FROM usuarios WHERE dni = $1', [dni]);
    
    if (existeUser.rows.length === 0) {
      await db.query(
        `INSERT INTO usuarios (rol_id, dni, nombres, apellidos, correo, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          rolDirectivoId,
          dni,
          'Director(a)',
          'Sagrado Corazón de María',
          'direccion@ie30216.edu.pe',
          passwordHash,
        ]
      );
      console.log(' Usuario DIRECTIVO inicial creado con éxito.');
      console.log(` Credenciales: DNI: ${dni} | Clave: ${passwordOriginal}`);
    } else {
      console.log(' El usuario DIRECTIVO inicial ya existe.');
    }
  } catch (error) {
    console.error('Error al ejecutar el seed:', error);
  } finally {
    process.exit();
  }
};

crearUsuarioDirectivoInicial();