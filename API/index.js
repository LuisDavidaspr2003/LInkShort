
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors'); 
const pool = require('../DB/db');
const { v4: uuidv4 } = require('uuid');
const app = express();



app.use(cors()); 
app.use(express.json());

// Ruta principal para crear un enlace corto
app.post('/shorten', async (req, res) => {
  const { long_url, short_url, expires_in } = req.body; 
  const generated_short_url = short_url || uuidv4().slice(0, 8); 

  if (!long_url) {
    return res.status(400).json({ error: 'Falta long_url' });
  }

  let expires_at = null;
  let time_remaining = null;

  if (expires_in) {
    const expiresInMilliseconds = expires_in * 60 * 1000; 
    expires_at = new Date(Date.now() + expiresInMilliseconds); 

    // Calcular el tiempo restante en milisegundos
    time_remaining = expiresInMilliseconds;
  }

  try {
    const existingLink = await pool.query('SELECT * FROM links WHERE short_url = $1', [generated_short_url]);
    if (existingLink.rows.length > 0) {
      return res.status(400).json({ error: 'El short_url ya está en uso. Por favor, elige otro.' });
    }

    const newLink = await pool.query(
      'INSERT INTO links (short_url, long_url, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [generated_short_url, long_url, expires_at]
    );

    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const fullShortUrl = `${serverUrl}/${generated_short_url}`;

    res.status(201).json({
      short_url: fullShortUrl,
      long_url: long_url,
      expires_at: expires_at,
      time_remaining: time_remaining  // Enviar el tiempo restante en milisegundos
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para redirigir al enlace largo usando el enlace corto
app.get('/:short_url', async (req, res) => {
  const { short_url } = req.params;

  try {
    const result = await pool.query('SELECT long_url, expires_at FROM links WHERE short_url = $1', [short_url]);
    
    if (result.rows.length > 0) {
      const link = result.rows[0];

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return res.status(410).send('El enlace ha expirado'); 
      }

      res.redirect(link.long_url); 
    } else {
      res.status(404).send('Link no encontrado');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});



// Función para eliminar los enlaces caducados
const deleteExpiredLinks = async () => {
  try {
    const result = await pool.query('DELETE FROM links WHERE expires_at < NOW() RETURNING *');
    if (result.rowCount > 0) {
      console.log(`Se eliminaron ${result.rowCount} enlaces caducados.`);
    }
  } catch (err) {
    console.error('Error al eliminar enlaces caducados:', err.message);
  }
};

// Ejecutar la eliminación de enlaces caducados cada hora
setInterval(deleteExpiredLinks, 60000);
     
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
