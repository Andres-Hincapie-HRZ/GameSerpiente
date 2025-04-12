const canvas = document.getElementById('juego');
        const ctx = canvas.getContext('2d');
        const puntuacionElement = document.getElementById('puntuacion');
        const nivelElement = document.getElementById('nivel');
        const inicioElement = document.getElementById('inicio');
        const pausaButton = document.getElementById('pausa');
        const panelOpciones = document.getElementById('panel-opciones');
        const efectoComida = document.getElementById('efecto-comida');
        const mensajeNivel = document.getElementById('mensaje-nivel');
        const toggleMusicaButton = document.getElementById('toggle-musica');

        // Sonidos
        const sonidoComida = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        const sonidoGameOver = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        const sonidoNivel = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        // Música de fondo
        let musicaActiva = true;
        let audioMusica = null;

        // Configuración
        const TAMANO_CELDA = 20;
        let VELOCIDAD_INICIAL = 250;
        let velocidad = VELOCIDAD_INICIAL;
        let puntuacion = 0;
        let nivel = 1;
        let juegoActivo = false;
        let juegoPausado = false;
        let efectosActivos = true;
        let modoJuego = 'clasico';
        let colorSerpiente = '#00ff00';
        let enemigos = [];
        let bombas = [];
        let tiempoRestante = 60;
        let tiempoExtra = 0;
        let tiempoInicio = 0;
        let ultimaColision = 0;
        let invulnerable = false;

        let serpiente = [
            { x: 15, y: 10 }
        ];
        let comida = generarComida();
        let direccion = 'derecha';
        let siguienteDireccion = 'derecha';

        // Inicializar controles
        document.getElementById('volumen').addEventListener('input', function() {
            const volumen = this.value / 100;
            sonidoComida.volume = volumen;
            sonidoGameOver.volume = volumen;
            sonidoNivel.volume = volumen;
        });

        document.getElementById('velocidad-inicial').addEventListener('input', function() {
            VELOCIDAD_INICIAL = 350 - this.value;
            if (juegoActivo && !juegoPausado) {
                velocidad = Math.max(150, VELOCIDAD_INICIAL - (puntuacion * 0.5));
            }
        });

        document.getElementById('efectos').addEventListener('change', function() {
            efectosActivos = this.checked;
        });

        document.querySelectorAll('.personaje-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.personaje-option').forEach(opt => opt.classList.remove('seleccionado'));
                this.classList.add('seleccionado');
                colorSerpiente = this.dataset.color;
            });
        });

        document.querySelectorAll('.modo-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.modo-option').forEach(opt => opt.classList.remove('seleccionado'));
                this.classList.add('seleccionado');
                modoJuego = this.dataset.modo;
            });
        });

        // Inicializar música
        function inicializarMusica() {
            audioMusica = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
            audioMusica.loop = true;
            audioMusica.volume = 0.5;
            
            // Intentar reproducir la música
            audioMusica.play().then(() => {
                toggleMusicaButton.textContent = "🔊 Música";
                musicaActiva = true;
            }).catch(error => {
                console.log("Error al reproducir música:", error);
                toggleMusicaButton.textContent = "🔈 Música";
                musicaActiva = false;
            });
        }

        function alternarMusica() {
            if (musicaActiva) {
                audioMusica.pause();
                toggleMusicaButton.textContent = "🔇 Música";
            } else {
                audioMusica.play();
                toggleMusicaButton.textContent = "🎵 Música";
            }
            musicaActiva = !musicaActiva;
        }

        function mostrarOpciones() {
            if (juegoActivo && !juegoPausado) {
                alternarPausa();
            }
            inicioElement.style.display = 'none';
            panelOpciones.style.display = 'block';
        }

        function iniciarJuegoDesdeOpciones() {
            panelOpciones.style.display = 'none';
            inicioElement.style.display = 'none';
            reiniciarJuego();
            juegoActivo = true;
            juegoPausado = false;
            gameLoop();
        }

        function generarComida() {
            return {
                x: Math.floor(Math.random() * (canvas.width / TAMANO_CELDA)),
                y: Math.floor(Math.random() * (canvas.height / TAMANO_CELDA))
            };
        }

        function dibujarCelda(x, y, color, esCabeza = false) {
            const posX = x * TAMANO_CELDA;
            const posY = y * TAMANO_CELDA;
            
            // Dibujar sombra
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            
            // Dibujar cuerpo
            ctx.fillStyle = color;
            
            if (esCabeza) {
                // Dibujar cabeza redondeada
                ctx.beginPath();
                ctx.arc(posX + TAMANO_CELDA/2, posY + TAMANO_CELDA/2, TAMANO_CELDA/2 - 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Dibujar ojos
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                
                // Posición de los ojos según la dirección
                let ojoX1, ojoX2, ojoY1, ojoY2;
                
                switch(direccion) {
                    case 'derecha':
                        ojoX1 = posX + TAMANO_CELDA - 5;
                        ojoX2 = ojoX1;
                        ojoY1 = posY + 5;
                        ojoY2 = posY + TAMANO_CELDA - 5;
                        break;
                    case 'izquierda':
                        ojoX1 = posX + 5;
                        ojoX2 = ojoX1;
                        ojoY1 = posY + 5;
                        ojoY2 = posY + TAMANO_CELDA - 5;
                        break;
                    case 'arriba':
                        ojoX1 = posX + 5;
                        ojoX2 = posX + TAMANO_CELDA - 5;
                        ojoY1 = posY + 5;
                        ojoY2 = ojoY1;
                        break;
                    case 'abajo':
                        ojoX1 = posX + 5;
                        ojoX2 = posX + TAMANO_CELDA - 5;
                        ojoY1 = posY + TAMANO_CELDA - 5;
                        ojoY2 = ojoY1;
                        break;
                }
                
                ctx.beginPath();
                ctx.arc(ojoX1, ojoY1, 2, 0, Math.PI * 2);
                ctx.arc(ojoX2, ojoY2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Dibujar cuerpo redondeado
                ctx.beginPath();
                ctx.arc(posX + TAMANO_CELDA/2, posY + TAMANO_CELDA/2, TAMANO_CELDA/2 - 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Restaurar sombra
            ctx.shadowBlur = 0;
        }

        function dibujarSerpiente() {
            serpiente.forEach((segmento, index) => {
                const esCabeza = index === 0;
                const color = esCabeza ? colorSerpiente : ajustarColor(colorSerpiente, -20);
                dibujarCelda(segmento.x, segmento.y, color, esCabeza);
            });
        }

        function dibujarComida() {
            const posX = comida.x * TAMANO_CELDA;
            const posY = comida.y * TAMANO_CELDA;
            
            // Dibujar sombra
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            
            // Dibujar manzana
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(
                posX + TAMANO_CELDA/2,
                posY + TAMANO_CELDA/2,
                TAMANO_CELDA/2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Dibujar tallo
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(posX + TAMANO_CELDA/2, posY + 2);
            ctx.quadraticCurveTo(
                posX + TAMANO_CELDA/2 + 5,
                posY - 5,
                posX + TAMANO_CELDA/2 + 10,
                posY + 2
            );
            ctx.stroke();
            
            // Restaurar sombra
            ctx.shadowBlur = 0;
        }

        function mostrarEfectoComida(x, y) {
            if (!efectosActivos) return;
            
            const posX = x * TAMANO_CELDA;
            const posY = y * TAMANO_CELDA;
            
            // Crear un efecto más sutil y menos intrusivo
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(
                posX + TAMANO_CELDA/2,
                posY + TAMANO_CELDA/2,
                TAMANO_CELDA,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        function mostrarMensajeNivel() {
            mensajeNivel.textContent = `¡Nivel ${nivel}!`;
            mensajeNivel.style.display = 'block';
            mensajeNivel.style.animation = 'none';
            mensajeNivel.offsetHeight; // Forzar reflow
            mensajeNivel.style.animation = 'aparecer-desvanecer 2s forwards';
            
            setTimeout(() => {
                mensajeNivel.style.display = 'none';
            }, 2000);
        }

        function mostrarTiempoExtra(x, y) {
            const tiempoExtra = document.createElement('div');
            tiempoExtra.className = 'tiempo-extra';
            tiempoExtra.textContent = '+10s';
            
            const canvasRect = canvas.getBoundingClientRect();
            const posX = canvasRect.left + (x * TAMANO_CELDA);
            const posY = canvasRect.top + (y * TAMANO_CELDA);
            
            tiempoExtra.style.position = 'fixed';
            tiempoExtra.style.left = posX + 'px';
            tiempoExtra.style.top = posY + 'px';
            
            document.body.appendChild(tiempoExtra);
            
            setTimeout(() => tiempoExtra.remove(), 1000);
        }

        function mostrarTiempoPerdido(x, y) {
            const tiempoPerdido = document.createElement('div');
            tiempoPerdido.className = 'tiempo-extra';
            tiempoPerdido.textContent = '-20s';
            tiempoPerdido.style.color = '#ff0000';
            tiempoPerdido.style.textShadow = '0 0 10px #ff0000';
            
            const canvasRect = canvas.getBoundingClientRect();
            const posX = canvasRect.left + (x * TAMANO_CELDA);
            const posY = canvasRect.top + (y * TAMANO_CELDA);
            
            tiempoPerdido.style.position = 'fixed';
            tiempoPerdido.style.left = posX + 'px';
            tiempoPerdido.style.top = posY + 'px';
            
            document.body.appendChild(tiempoPerdido);
            
            setTimeout(() => tiempoPerdido.remove(), 1000);
        }

        function ajustarColor(color, cantidad) {
            const hex = color.replace('#', '');
            const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + cantidad));
            const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + cantidad));
            const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + cantidad));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        function generarEnemigo() {
            let x, y;
            do {
                x = Math.floor(Math.random() * (canvas.width / TAMANO_CELDA));
                y = Math.floor(Math.random() * (canvas.height / TAMANO_CELDA));
            } while (serpiente.some(segmento => segmento.x === x && segmento.y === y) ||
                    (comida.x === x && comida.y === y));
            
            return { x, y, velocidad: Math.random() * 2 + 1, direccion: Math.random() * Math.PI * 2 };
        }

        function moverEnemigos() {
            if (modoJuego !== 'enemigos' && modoJuego !== 'supervivencia') return;

            enemigos.forEach(enemigo => {
                enemigo.x += Math.cos(enemigo.direccion) * enemigo.velocidad;
                enemigo.y += Math.sin(enemigo.direccion) * enemigo.velocidad;

                // Rebote en los bordes
                if (enemigo.x < 0 || enemigo.x >= canvas.width / TAMANO_CELDA) {
                    enemigo.direccion = Math.PI - enemigo.direccion;
                }
                if (enemigo.y < 0 || enemigo.y >= canvas.height / TAMANO_CELDA) {
                    enemigo.direccion = -enemigo.direccion;
                }
            });
        }

        function dibujarEnemigos() {
            if (modoJuego !== 'enemigos' && modoJuego !== 'supervivencia') return;

            enemigos.forEach(enemigo => {
                const posX = enemigo.x * TAMANO_CELDA;
                const posY = enemigo.y * TAMANO_CELDA;
                
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#ff0000';
                
                ctx.beginPath();
                ctx.arc(posX + TAMANO_CELDA/2, posY + TAMANO_CELDA/2, TAMANO_CELDA/2 - 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
            });
        }

        function colisionConEnemigos(cabeza) {
            return enemigos.some(enemigo => {
                const distancia = Math.sqrt(
                    Math.pow((enemigo.x - cabeza.x) * TAMANO_CELDA, 2) +
                    Math.pow((enemigo.y - cabeza.y) * TAMANO_CELDA, 2)
                );
                return distancia < TAMANO_CELDA;
            });
        }

        function generarBomba() {
            let x, y;
            do {
                x = Math.floor(Math.random() * (canvas.width / TAMANO_CELDA));
                y = Math.floor(Math.random() * (canvas.height / TAMANO_CELDA));
            } while (serpiente.some(segmento => segmento.x === x && segmento.y === y) ||
                    (comida.x === x && comida.y === y) ||
                    bombas.some(bomba => bomba.x === x && bomba.y === y));
            
            return { 
                x, 
                y, 
                tiempoExplosion: Math.random() * 3 + 2,
                radioExplosion: 2,
                explotada: false
            };
        }

        function dibujarBombas() {
            if (modoJuego !== 'supervivencia' && modoJuego !== 'tiempo') return;

            bombas.forEach(bomba => {
                const posX = bomba.x * TAMANO_CELDA;
                const posY = bomba.y * TAMANO_CELDA;
                
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 15;
                ctx.fillStyle = bomba.tiempoExplosion < 1 ? '#ff0000' : '#ff6600';
                
                ctx.beginPath();
                ctx.arc(posX + TAMANO_CELDA/2, posY + TAMANO_CELDA/2, TAMANO_CELDA/2 - 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(posX + TAMANO_CELDA/2, posY + TAMANO_CELDA/2);
                ctx.lineTo(posX + TAMANO_CELDA/2 + 10, posY + TAMANO_CELDA/2 - 10);
                ctx.stroke();
                
                ctx.shadowBlur = 0;
            });
        }

        function actualizarBombas() {
            if (modoJuego !== 'supervivencia' && modoJuego !== 'tiempo') return;

            bombas.forEach((bomba, index) => {
                if (modoJuego === 'supervivencia') {
                    bomba.tiempoExplosion -= 1/60;
                }
                
                // Verificar colisión con la serpiente
                const cabeza = serpiente[0];
                if (cabeza.x === bomba.x && cabeza.y === bomba.y && !bomba.explotada) {
                    bomba.explotada = true;
                    
                    if (modoJuego === 'tiempo') {
                        tiempoExtra -= 20; // Restar 20 segundos
                        mostrarTiempoPerdido(bomba.x, bomba.y);
                        bombas.splice(index, 1);
                        // Generar una nueva bomba en una posición aleatoria
                        bombas.push(generarBomba());
                    } else {
                        crearExplosion(bomba.x, bomba.y, bomba.radioExplosion);
                        bombas.splice(index, 1);
                    }
                }
                
                if (modoJuego === 'supervivencia' && bomba.tiempoExplosion <= 0 && !bomba.explotada) {
                    bomba.explotada = true;
                    crearExplosion(bomba.x, bomba.y, bomba.radioExplosion);
                    bombas.splice(index, 1);
                }
            });
        }

        function crearExplosion(x, y, radio) {
            // Crear múltiples círculos de explosión
            for (let i = 0; i < 3; i++) {
                const explosion = document.createElement('div');
                explosion.className = 'explosion';
                
                // Calcular la posición relativa al canvas
                const canvasRect = canvas.getBoundingClientRect();
                const explosionX = canvasRect.left + (x * TAMANO_CELDA);
                const explosionY = canvasRect.top + (y * TAMANO_CELDA);
                
                explosion.style.position = 'fixed';
                explosion.style.left = explosionX + 'px';
                explosion.style.top = explosionY + 'px';
                explosion.style.width = (TAMANO_CELDA * (radio * 2 + 1)) + 'px';
                explosion.style.height = (TAMANO_CELDA * (radio * 2 + 1)) + 'px';
                explosion.style.background = 'radial-gradient(circle, rgba(255,102,0,1) 0%, rgba(255,0,0,0.8) 50%, rgba(255,0,0,0) 100%)';
                explosion.style.animationDelay = (i * 0.1) + 's';
                explosion.style.zIndex = '1000';
                document.body.appendChild(explosion);

                setTimeout(() => explosion.remove(), 500);
            }

            // Verificar colisión con la serpiente
            serpiente.forEach((segmento, index) => {
                const distancia = Math.sqrt(
                    Math.pow((segmento.x - x) * TAMANO_CELDA, 2) +
                    Math.pow((segmento.y - y) * TAMANO_CELDA, 2)
                );
                if (distancia < TAMANO_CELDA * (radio + 0.5)) {
                    if (!invulnerable) {
                        gameOver();
                    }
                }
            });
        }

        function colisionConParedes(cabeza) {
            if (modoJuego === 'supervivencia') {
                if (cabeza.x < 0) cabeza.x = canvas.width / TAMANO_CELDA - 1;
                if (cabeza.x >= canvas.width / TAMANO_CELDA) cabeza.x = 0;
                if (cabeza.y < 0) cabeza.y = canvas.height / TAMANO_CELDA - 1;
                if (cabeza.y >= canvas.height / TAMANO_CELDA) cabeza.y = 0;
                return false;
            }
            return cabeza.x < 0 || cabeza.x >= canvas.width / TAMANO_CELDA ||
                   cabeza.y < 0 || cabeza.y >= canvas.height / TAMANO_CELDA;
        }

        function colisionConSerpiente(cabeza) {
            return serpiente.some(segmento => segmento.x === cabeza.x && segmento.y === cabeza.y);
        }

        function gameOver() {
            juegoActivo = false;
            
            // Detener la música de fondo
            if (musicaActiva && audioMusica) {
                audioMusica.pause();
                musicaActiva = false;
                toggleMusicaButton.textContent = "🔈 Música";
            }
            
            // Sonido de game over
            sonidoGameOver.currentTime = 0;
            sonidoGameOver.volume = 0.7;
            sonidoGameOver.play().catch(e => console.log("Error al reproducir sonido"));
            
            inicioElement.style.display = 'block';
            inicioElement.innerHTML = `
                <h1>¡Game Over!</h1>
                <p>Puntuación final: ${puntuacion}</p>
                <p>Nivel alcanzado: ${nivel}</p>
                <p>Presiona ESPACIO para jugar de nuevo</p>
                <button onclick="reiniciarJuego()">Jugar de nuevo</button>
            `;
        }

        function reiniciarJuego() {
            serpiente = [{ x: 15, y: 10 }];
            direccion = 'derecha';
            siguienteDireccion = 'derecha';
            puntuacion = 0;
            nivel = 1;
            velocidad = VELOCIDAD_INICIAL;
            puntuacionElement.textContent = `Puntuación: ${puntuacion}`;
            nivelElement.textContent = `Nivel: ${nivel}`;
            comida = generarComida();
            enemigos = [];
            bombas = [];
            tiempoRestante = 60;
            tiempoExtra = 0;
            tiempoInicio = Date.now();
            invulnerable = false;

            if (modoJuego === 'enemigos') {
                for (let i = 0; i < nivel * 2; i++) {
                    enemigos.push(generarEnemigo());
                }
            } else if (modoJuego === 'supervivencia' || modoJuego === 'tiempo') {
                for (let i = 0; i < nivel; i++) {
                    bombas.push(generarBomba());
                }
            }
            
            if (!musicaActiva && audioMusica) {
                audioMusica.currentTime = 0;
                audioMusica.play().then(() => {
                    musicaActiva = true;
                    toggleMusicaButton.textContent = "🔊 Música";
                }).catch(e => console.log("Error al reiniciar música:", e));
            }
            
            iniciarJuego();
        }

        function iniciarJuego() {
            if (juegoActivo) return;
            juegoActivo = true;
            juegoPausado = false;
            pausaButton.textContent = "Pausar";
            inicioElement.style.display = 'none';
            gameLoop();
        }

        function alternarPausa() {
            if (!juegoActivo) return;
            
            juegoPausado = !juegoPausado;
            pausaButton.textContent = juegoPausado ? "Continuar" : "Pausar";
            
            if (juegoPausado) {
                // Detener la música si está activa
                if (musicaActiva && audioMusica) {
                    audioMusica.pause();
                }
            } else {
                // Reanudar la música si estaba activa
                if (musicaActiva && audioMusica) {
                    audioMusica.play();
                }
                // Reiniciar el bucle del juego
                gameLoop();
            }
        }

        function gameLoop() {
            if (!juegoActivo || juegoPausado) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (modoJuego === 'tiempo') {
                const tiempoActual = Date.now();
                tiempoRestante = Math.max(0, Math.ceil(60 + tiempoExtra - (tiempoActual - tiempoInicio) / 1000));
                ctx.fillStyle = tiempoRestante <= 10 ? '#ff0000' : '#fff';
                ctx.font = '20px Arial';
                ctx.fillText(`Tiempo: ${tiempoRestante}s`, 10, 30);
                
                if (tiempoRestante === 0) {
                    gameOver();
                    return;
                }

                actualizarBombas();
                dibujarBombas();
            }

            moverSerpiente();
            if (modoJuego === 'enemigos') {
                moverEnemigos();
                dibujarEnemigos();
            } else if (modoJuego === 'supervivencia') {
                actualizarBombas();
                dibujarBombas();
            }
            dibujarSerpiente();
            dibujarComida();

            setTimeout(gameLoop, velocidad);
        }

        function moverSerpiente() {
            direccion = siguienteDireccion;
            const cabeza = { ...serpiente[0] };

            switch (direccion) {
                case 'arriba': cabeza.y--; break;
                case 'abajo': cabeza.y++; break;
                case 'izquierda': cabeza.x--; break;
                case 'derecha': cabeza.x++; break;
            }

            if (modoJuego === 'supervivencia') {
                if (cabeza.x < 0) cabeza.x = canvas.width / TAMANO_CELDA - 1;
                if (cabeza.x >= canvas.width / TAMANO_CELDA) cabeza.x = 0;
                if (cabeza.y < 0) cabeza.y = canvas.height / TAMANO_CELDA - 1;
                if (cabeza.y >= canvas.height / TAMANO_CELDA) cabeza.y = 0;
            }

            if ((modoJuego !== 'supervivencia' && colisionConParedes(cabeza)) || 
                colisionConSerpiente(cabeza) || 
                (modoJuego === 'enemigos' && colisionConEnemigos(cabeza))) {
                if (!invulnerable) {
                    gameOver();
                    return;
                }
            }

            serpiente.unshift(cabeza);

            if (cabeza.x === comida.x && cabeza.y === comida.y) {
                puntuacion += 10;
                puntuacionElement.textContent = `Puntuación: ${puntuacion}`;
                
                if (modoJuego === 'tiempo') {
                    tiempoExtra += 10;
                    mostrarTiempoExtra(comida.x, comida.y);
                }
                
                mostrarEfectoComida(comida.x, comida.y);
                
                sonidoComida.currentTime = 0;
                sonidoComida.play().catch(e => console.log("Error al reproducir sonido"));
                
                const nuevoNivel = Math.floor(puntuacion / 50) + 1;
                if (nuevoNivel > nivel) {
                    nivel = nuevoNivel;
                    nivelElement.textContent = `Nivel: ${nivel}`;
                    mostrarMensajeNivel();
                    
                    if (modoJuego === 'enemigos') {
                        enemigos.push(generarEnemigo());
                    } else if (modoJuego === 'supervivencia' || modoJuego === 'tiempo') {
                        for (let i = 0; i < nivel; i++) {
                            bombas.push(generarBomba());
                        }
                    }
                    
                    sonidoNivel.currentTime = 0;
                    sonidoNivel.play().catch(e => console.log("Error al reproducir sonido"));
                }
                
                comida = generarComida();
                velocidad = Math.max(150, VELOCIDAD_INICIAL - (puntuacion * 0.5));
            } else {
                serpiente.pop();
            }
        }

        document.addEventListener('keydown', (evento) => {
            if (evento.key === ' ' && !juegoActivo) {
                reiniciarJuego();
                return;
            }
            
            // Si el juego está pausado, solo permitir la tecla P para continuar
            if (juegoPausado) {
                if (evento.key === 'p' || evento.key === 'P') {
                    alternarPausa();
                }
                return;
            }
            
            if (!juegoActivo) return;

            switch (evento.key) {
                case 'ArrowUp':
                    if (direccion !== 'abajo') siguienteDireccion = 'arriba';
                    break;
                case 'ArrowDown':
                    if (direccion !== 'arriba') siguienteDireccion = 'abajo';
                    break;
                case 'ArrowLeft':
                    if (direccion !== 'derecha') siguienteDireccion = 'izquierda';
                    break;
                case 'ArrowRight':
                    if (direccion !== 'izquierda') siguienteDireccion = 'derecha';
                    break;
                case 'p':
                case 'P':
                    alternarPausa();
                    break;
                case 'm':
                case 'M':
                    alternarMusica();
                    break;
            }
        });

        // Inicializar música al cargar la página
        window.addEventListener('load', inicializarMusica);