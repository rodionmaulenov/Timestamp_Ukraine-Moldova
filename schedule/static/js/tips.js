function tipBefore(tooltipElement) {
    const getHoveredElm = tooltipElement.querySelector('.tips')

    getHoveredElm.addEventListener('mouseenter', () => {
        getHoveredElm.classList.add('hovered');
    });

    getHoveredElm.addEventListener('mouseleave', () => {
        getHoveredElm.classList.remove('hovered');

    });

}

function svgEffectsWhenClicking(tooltipElement) {
    const getHoveredElm = tooltipElement.querySelector('.copy-deadline');

    getHoveredElm.addEventListener('click', function () {

        getHoveredElm.classList.add('reset-state');

        // Trigger a reflow to ensure the default state is applied
        void getHoveredElm.offsetWidth;

        setTimeout(() => {
            getHoveredElm.classList.remove('reset-state');
        }, 200);
    });
}

