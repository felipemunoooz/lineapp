# 🎵 LineApp — Tu festival perfecto

Generador de flyers de festival personalizado basado en tu historial de Spotify.

## Características
- 🎨 **7 temas visuales** según tu género musical (Pop, Rock, Electronic, Hip-Hop, Indie, Jazz)
- 🎤 **Lineup real** basado en tus top artistas de Spotify
- 📍 **Conciertos cercanos** de tus artistas en tu ciudad (via Bandsintown)
- 📊 **Perfil musical** con breakdown de géneros
- 📤 **Compartir** en redes sociales

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
El archivo `.env` ya está configurado con tus credenciales de Spotify.

### 3. Correr el servidor
```bash
node server.js
```

### 4. Abrir en el navegador
```
http://127.0.0.1:3000
```

## Estructura
```
lineapp/
├── server.js          # Backend Express + Spotify OAuth
├── .env               # Credenciales (NO subir a git)
├── package.json
└── public/
    ├── index.html     # Landing page
    └── app.html       # App principal con flyer
```

## Próximos pasos
- [ ] Descarga real del flyer (html2canvas)
- [ ] Comparar festival con amigos
- [ ] Playlist del festival en Spotify
- [ ] Deploy en lineapp.club

## ⚠️ Importante
- Nunca subas `.env` a GitHub
- Agrega `.env` a tu `.gitignore`
