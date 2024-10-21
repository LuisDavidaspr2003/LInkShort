import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LinkShortener.css'; 

const LinkShortener = () => {
    const [longUrl, setLongUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [expiresIn, setExpiresIn] = useState('');
    const [message, setMessage] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setTimeRemaining(null);

        try {
            const response = await axios.post('http://localhost:5000/shorten', {
                long_url: longUrl,
                short_url: shortUrl,
                expires_in: expiresIn,
            });

            setMessage(`Enlace corto creado: ${response.data.short_url}`);
            setLongUrl('');
            setShortUrl('');
            setExpiresIn('');

            // Si hay tiempo restante, configura la cuenta regresiva
            if (response.data.time_remaining) {
                setTimeRemaining(response.data.time_remaining);
            }
        } catch (error) {
            setMessage('Error al crear el enlace. Intenta con otro short_url o verifica el long_url.');
        }
    };

    // Función para convertir milisegundos en minutos y segundos
    const formatTime = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes} minutos y ${seconds} segundos`;
    };

    // Efecto para manejar la cuenta regresiva
    useEffect(() => {
        if (timeRemaining > 0) {
            const interval = setInterval(() => {
                setTimeRemaining(prev => prev - 1000);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [timeRemaining]);

    return (
        <div className="link-shortener-container">
            <h1>Acortador de Links</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="longUrl">URL Larga:</label>
                    <input
                        type="url"
                        id="longUrl"
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="shortUrl">URL Corta (opcional):</label>
                    <input
                        type="text"
                        id="shortUrl"
                        value={shortUrl}
                        onChange={(e) => setShortUrl(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="expiresIn">Expira en (minutos):</label>
                    <input
                        type="number"
                        id="expiresIn"
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(e.target.value)}
                    />
                </div>
                <button type="submit">Acortar URL</button>
            </form>
            {message && <p>{message}</p>}
            
            {timeRemaining !== null && timeRemaining > 0 && (
                <p>Tiempo restante: {formatTime(timeRemaining)}</p>
            )}
        </div>
    );
};

export default LinkShortener;
