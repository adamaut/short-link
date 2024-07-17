const express = require('express');
const mysql = require('mysql2/promise');
const shortid = require('shortid');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Fonction pour créer une connexion à la base de données
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

app.post('/shorten', async (req, res) => {
  const { longUrl } = req.body;
  const shortCode = shortid.generate();
  const shortUrl = `https://urlsnap.unaux.com/${shortCode}`; // Remplacez par votre domaine réel

  try {
    const connection = await getConnection();
    await connection.execute('INSERT INTO links (long_url, short_code) VALUES (?, ?)', [longUrl, shortCode]);
    await connection.end();
    res.json({ shortUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la création du lien court.' });
  }
});

app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT long_url FROM links WHERE short_code = ?', [shortCode]);
    await connection.end();

    if (rows.length > 0) {
      res.redirect(rows[0].long_url);
    } else {
      res.status(404).send('Lien non trouvé');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Une erreur est survenue lors de la redirection.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
