import { throttle } from '../utils';
class MouseMove {
    constructor() {
        this.cards = [];
    }
    init() {
        this.getCardNodes();
        this.initMouseMoveObserver();
    }
    initMouseMoveObserver() {
        window.removeEventListener('mousemove', () => { });
        window.addEventListener('mousemove', throttle((event) => {
            const x = event.pageX;
            const y = event.pageY;
            this._setMouseLocationToCard(x, y);
        }, 50));
    }
    getCardNodes() {
        const cards = document.querySelectorAll('.magic-card');
        this.cards = cards;
        cards.forEach((card) => {
            // @ts-ignore
            card.setAttribute('data-x', card.offsetLeft);
            // @ts-ignore
            card.setAttribute('data-y', card.offsetTop);
            // @ts-ignore
            card.setAttribute('data-width', card.clientWidth);
            // @ts-ignore
            card.setAttribute('data-height', card.clientHeight);
        });
    }
    _setMouseLocationToCard(mouseX, mouseY) {
        this.cards.forEach((card) => {
            // @ts-ignore
            const { x: cardX, y: cardY, width, height } = card.dataset;
            const x = Math.floor(mouseX - cardX);
            const y = Math.floor(mouseY - cardY);
            // @ts-ignore
            card.style.setProperty('--x', `${x}px`);
            // @ts-ignore
            card.style.setProperty('--y', `${y}px`);
        });
    }
}
const mouseMove = new MouseMove();
export function useMagicCard() {
    const initMagicCard = () => {
        mouseMove.init();
    };
    return { initMagicCard };
}
