// d:\CauLib\js\scroll.js

document.addEventListener("DOMContentLoaded", () => {
    // Registra o ScrollTrigger e o Observer no GSAP
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        if (typeof Observer !== 'undefined') {
            gsap.registerPlugin(Observer);
        }
    }
});

window.addEventListener("load", () => {
    console.log("Iniciando ScrollTrigger e Observer (Drag to Scroll)...");

    const track = document.querySelector('.scroll-track');
    const wrapper = document.querySelector('.gallery-wrapper');
    const cards = document.querySelectorAll('.album-card');

    if (!wrapper || !track || cards.length === 0) return;

    const N = cards.length;
    const loops = 50;

    const maxZ = N * 800 * loops;
    const maxX = N * -15 * loops;
    const maxY = N * 10 * loops;

    gsap.to(wrapper, {
        z: maxZ,
        x: `${maxX}vw`,
        y: `${maxY}vh`,
        ease: "none",
        scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: updateCards
        }
    });

    function updateCards() {
        const wrapperZ = gsap.getProperty(wrapper, "z") || 0;

        cards.forEach((card, index) => {
            let cycle = parseInt(card.dataset.cycle || 0);

            let cardLocalZ = (index + cycle * N) * -800;
            let globalZ = wrapperZ + cardLocalZ;

            // --- RECICLAGEM DE DOM ---
            if (globalZ > 300) {
                cycle += 1;
                card.dataset.cycle = cycle;
                cardLocalZ = (index + cycle * N) * -800;
                globalZ = wrapperZ + cardLocalZ;
            }
            else if (globalZ < 300 - (N * 800)) {
                cycle -= 1;
                card.dataset.cycle = cycle;
                cardLocalZ = (index + cycle * N) * -800;
                globalZ = wrapperZ + cardLocalZ;
            }

            // --- MATRIZ DIAGONAL INFINITA ---
            const cardLocalX = (index + cycle * N) * 15;
            const cardLocalY = (index + cycle * N) * -10;

            card.style.setProperty('--tx', `${cardLocalX}vw`);
            card.style.setProperty('--ty', `${cardLocalY}vh`);
            card.style.setProperty('--tz', `${cardLocalZ}px`);

            // Hierarquia 3D blindada (Z-index dinâmico)
            card.style.zIndex = Math.round(globalZ);

            // --- CINEMATIC DEPTH OF FIELD ---
            let op = 1;
            let blur = 0;
            let s = 1;

            if (globalZ > 50 && globalZ <= 250) {
                const progress = (globalZ - 50) / 200;
                op = 1 - progress;
                blur = progress * 15;
                s = 1 + (progress * 0.2);
            } else if (globalZ > 250) {
                op = 0;
                blur = 15;
                s = 1.2;
            }

            card.style.setProperty('--op', op);
            card.style.setProperty('--blur', blur);
            card.style.setProperty('--s', s);
        });
    }

    // Força o cálculo inicial de Z-index antes do usuário realizar qualquer scroll
    updateCards();

    // --- DRAG TO SCROLL (GSAP OBSERVER) ---
    // Monitoramos eventos de touch e ponteiro no nível do window inteiro
    if (typeof Observer !== 'undefined') {
        window.dragObserver = Observer.create({
            target: window,
            type: "pointer,touch",
            wheelMultiplier: 1,
            touchMultiplier: 1,
            preventDefault: true,
            onPress: () => {
                document.body.classList.add("grabbing");
            },
            onRelease: () => {
                document.body.classList.remove("grabbing");
            },
            onChangeY: (self) => {
                // Multiplicador de velocidade (fricção) do arrasto.
                // Ajustável para tornar a pista mais 'leve' ou 'pesada'.
                const scrollVelocity = 3.5;

                // Eixo matematicamente blindado: delta puro negativo sobe, positivo desce.
                window.scrollBy(0, +self.deltaY * scrollVelocity);
            }
        });
    }
});
