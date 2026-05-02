// d:\CauLib\js\main.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Awwwards Rock Experience - Main App Initialized");
    const app = document.getElementById('app'); 
    
    if (typeof window.albums !== 'undefined') {
        // Embaralhamento Fisher-Yates (Shuffle)
        for (let i = window.albums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [window.albums[i], window.albums[j]] = [window.albums[j], window.albums[i]];
        }

        window.albums.forEach((album, index) => {
            // Wrapper Externo (Física do GSAP)
            const card = document.createElement('div');
            card.classList.add('album-card');
            card.dataset.id = album.id;
            
            card.style.setProperty('--aura-color', album.colorAura);
            
            const zOffset = Math.round(index * -800); 
            const xOffset = Math.round(index * 15);   
            const yOffset = Math.round(index * -10);  
            
            card.style.setProperty('--tx', `${xOffset}vw`);
            card.style.setProperty('--ty', `${yOffset}vh`);
            card.style.setProperty('--tz', `${zOffset}px`);
            
            // A opacidade base é regida estritamente pelo style.css agora. Nenhuma matemática de fade-in.
            
            // Wrapper Interno (Efeito de Hover 'Tilt' Vanilla CSS)
            const inner = document.createElement('div');
            inner.classList.add('album-inner');
            
            const img = document.createElement('img');
            img.classList.add('album-cover');
            img.src = album.cover;
            img.alt = `Capa do álbum ${album.title} por ${album.artist}`;
            
            inner.appendChild(img);
            card.appendChild(inner);
            app.appendChild(card);
        });
        
    } else {
        console.error("Erro: albums.js não foi carregado corretamente.");
    }
});

window.addEventListener('load', () => {
    const loader = document.getElementById('global-loader');
    const cards = document.querySelectorAll('.album-card');
    
    const tl = gsap.timeline();
    
    if (loader) {
        tl.to(loader, { 
            opacity: 0, 
            duration: 0.8, 
            ease: "power2.inOut", 
            onComplete: () => loader.remove() 
        });
    }
    
    if (cards.length > 0) {
        tl.from(cards, { 
            y: 100, 
            opacity: 0, 
            stagger: 0.05, 
            duration: 0.8, 
            ease: "back.out(1.2)",
            clearProps: "opacity,transform"
        }, "-=0.4");
    }
});
