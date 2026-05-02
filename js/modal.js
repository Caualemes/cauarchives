// d:\CauLib\js\modal.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Modal controller initialized - Navigation Version");
    
    const modal = document.getElementById('album-modal');
    const modalBg = document.getElementById('modal-bg');
    const closeModalBtn = document.getElementById('close-modal');
    
    const prevAlbumBtn = document.getElementById('prev-album');
    const nextAlbumBtn = document.getElementById('next-album');
    
    const modalCover = document.getElementById('modal-cover');
    const modalTitle = document.getElementById('modal-title');
    const modalArtist = document.getElementById('modal-artist');
    const modalYear = document.getElementById('modal-year');
    
    const customAudioPlayer = document.getElementById('custom-audio-player');
    const customTrackName = document.getElementById('custom-track-name');
    const customPlayBtn = document.getElementById('custom-play-btn');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const paginationDotsContainer = document.getElementById('pagination-dots');

    let modalTl;
    let currentAudio = null;
    let currentAlbumIndex = 0;
    
    // Armazena o ID do intervalo de fade para poder cancelar sobreposições
    let fadeInterval = null;

    const fadeAudio = (audioElement, type, duration) => {
        if (!audioElement) return Promise.resolve();
        
        // Sempre cancela o fade anterior imediatamente para evitar conflitos (volume travando em 0, etc)
        clearInterval(fadeInterval);
        
        return new Promise(resolve => {
            const startVolume = type === 'in' ? 0 : audioElement.volume;
            const targetVolume = type === 'in' ? 1 : 0;
            
            if (type === 'in') {
                audioElement.volume = 0;
                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.log('Autoplay prevenido ou interrompido: ', error));
                }
            }
            
            const steps = 30; // 30 quadros de atualização no intervalo
            const stepTime = duration / steps;
            let currentStep = 0;
            
            fadeInterval = setInterval(() => {
                currentStep++;
                const progress = currentStep / steps;
                
                if (audioElement) {
                    // Impede que o volume ultrapasse os limites matemáticos
                    audioElement.volume = Math.max(0, Math.min(1, startVolume + (targetVolume - startVolume) * progress));
                }
                
                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    if (type === 'out' && audioElement) {
                        audioElement.pause();
                    }
                    resolve();
                }
            }, stepTime);
        });
    };

    customPlayBtn.addEventListener('click', () => {
        if (!currentAudio) return; 
        
        if (currentAudio.paused) {
            fadeAudio(currentAudio, 'in', 500); 
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
        } else {
            fadeAudio(currentAudio, 'out', 500); 
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
        }
    });

    const closeModal = () => {
        document.body.style.overflow = '';
        if (window.dragObserver) window.dragObserver.enable();
        
        if (currentAudio) {
            const audioToFade = currentAudio; 
            currentAudio = null; 
            fadeAudio(audioToFade, 'out', 500).then(() => {
                audioToFade.src = ''; 
            });
        }
        
        if (modalTl) {
            modalTl.reverse().then(() => {
                modal.classList.add('pointer-events-none');
                iconPlay.classList.remove('hidden');
                iconPause.classList.add('hidden');
                progressBarFill.style.width = '0%';
            });
        }
    };

    closeModalBtn.addEventListener('click', closeModal);
    modalBg.addEventListener('click', closeModal);

    const updateModalUI = (album, isInitialOpen) => {
        modalCover.src = album.cover;
        modalTitle.textContent = album.title;
        modalArtist.textContent = album.artist;
        modalYear.textContent = album.year;
        
        const aura = album.colorAura && album.colorAura !== 'none' ? album.colorAura : '#888888';
        modalBg.style.background = `radial-gradient(circle at center, ${aura}40 0%, #ffffff 80%)`;
        
        customTrackName.textContent = album.favoriteTrack || "Faixa Desconhecida";
        progressBarFill.style.width = '0%';
        
        // Atualiza bolinhas (Pagination Dots)
        if (paginationDotsContainer) {
            paginationDotsContainer.innerHTML = '';
            window.albums.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `cursor-pointer hover:bg-gray-600 hover:scale-125 h-2 rounded-full transition-all duration-300 ${idx === currentAlbumIndex ? 'bg-black w-6' : 'bg-black/20 w-2'}`;
                
                dot.addEventListener('click', () => {
                    if (idx !== currentAlbumIndex) {
                        if (currentAudio) {
                            clearInterval(fadeInterval);
                            currentAudio.volume = 0;
                            currentAudio.pause();
                            currentAudio.src = '';
                            currentAudio = null;
                        }
                        loadAlbumIntoModal(idx, false);
                    }
                });
                
                paginationDotsContainer.appendChild(dot);
            });
        }
        
        if (!isInitialOpen) {
            gsap.fromTo([modalCover, modalTitle, modalArtist, customAudioPlayer], 
                { opacity: 0, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05, overwrite: "auto" }
            );
        }
    };

    const loadAlbumIntoModal = (index, isInitialOpen = false) => {
        currentAlbumIndex = index;
        const album = window.albums[currentAlbumIndex];
        if (!album) return;
        
        updateModalUI(album, isInitialOpen);
        
        if (album.audioSrc) {
            currentAudio = new Audio(album.audioSrc);
            fadeAudio(currentAudio, 'in', 800);
            
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
            
            currentAudio.addEventListener('timeupdate', () => {
                if (currentAudio && currentAudio.duration) {
                    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
                    progressBarFill.style.width = `${progress}%`;
                }
            });
            
            currentAudio.addEventListener('ended', () => {
                iconPlay.classList.remove('hidden');
                iconPause.classList.add('hidden');
                progressBarFill.style.width = '0%';
            });
        } else {
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
        }
        
        if (isInitialOpen) {
            document.body.style.overflow = 'hidden';
            if (window.dragObserver) window.dragObserver.disable();
            
            modal.classList.remove('pointer-events-none');
            
            gsap.set([modalTitle, modalArtist, modalYear, customAudioPlayer], { clearProps: "all" });
            
            if (modalTl) modalTl.kill();
            
            modalTl = gsap.timeline();
            
            modalTl.to(modal, { opacity: 1, duration: 0.3, ease: "power2.out" })
            .fromTo(modalCover, 
                { scale: 0.6, y: 50, rotateY: -20, rotateX: 10 },
                { scale: 1, y: 0, rotateY: 0, rotateX: 0, duration: 0.6, ease: "back.out(1.5)" }
            )
            .fromTo([modalTitle, modalArtist, modalYear, customAudioPlayer],
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
                "-=0.4"
            );
        }
    };

    const nextAlbum = () => {
        if (currentAudio) {
            clearInterval(fadeInterval);
            currentAudio.volume = 0;
            currentAudio.pause();
            currentAudio.src = '';
            currentAudio = null;
        }
        const newIndex = (currentAlbumIndex + 1) % window.albums.length;
        loadAlbumIntoModal(newIndex, false);
    };

    const prevAlbum = () => {
        if (currentAudio) {
            clearInterval(fadeInterval);
            currentAudio.volume = 0;
            currentAudio.pause();
            currentAudio.src = '';
            currentAudio = null;
        }
        const newIndex = (currentAlbumIndex - 1 + window.albums.length) % window.albums.length;
        loadAlbumIntoModal(newIndex, false);
    };

    nextAlbumBtn.addEventListener('click', nextAlbum);
    prevAlbumBtn.addEventListener('click', prevAlbum);

    // Suporte a Swipe para Mobile
    let touchStartX = 0;
    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        
        if (diff < -50) {
            nextAlbum();
        } else if (diff > 50) {
            prevAlbum();
        }
    }, { passive: true });

    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('.album-card');
        if (card) {
            const albumId = parseInt(card.dataset.id);
            const index = window.albums.findIndex(a => a.id === albumId);
            if (index !== -1) {
                if (currentAudio) {
                    clearInterval(fadeInterval);
                    currentAudio.volume = 0;
                    currentAudio.pause();
                    currentAudio.src = '';
                    currentAudio = null;
                }
                loadAlbumIntoModal(index, true);
            }
        }
    });

    // Suporte a Teclado para Desktop
    document.addEventListener('keydown', (e) => {
        const isModalOpen = !modal.classList.contains('pointer-events-none');
        
        if (isModalOpen) {
            if (e.key === 'ArrowRight') {
                nextAlbum();
            } else if (e.key === 'ArrowLeft') {
                prevAlbum();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        }
    });
});
