function getTooltipDataExcludingHeader(surrogasyName, tooltipElement) {
    if (tooltipElement) {
        const getTooltipContent = tooltipElement.querySelectorAll(
            '.tooltip_content:not(.tooltip_header)'
        );

        let tooltipData = [];

        tooltipData.push({
            name: surrogasyName,
            span: '',
            div: ''
        });

        getTooltipContent.forEach(content => {

            const spanText = content.querySelector('span')?.innerText || '';

            const divText = content.querySelector('div')?.innerText || '';

            if (spanText && divText) {
                tooltipData.push({
                    span: spanText,
                    div: divText
                });
            }
        });

        const dataCopy = tooltipData.map(item => {
            if (item.name) {
                return `Name: ${item.name}`;
            }
            return `${item.span} ${item.div}`;
        }).join('\n');

        copyToClipboard(dataCopy, tooltipElement);
    }
}

function copyToClipboard(text, tooltipElement) {

    const temporaryInput = document.createElement('textarea');
    temporaryInput.style.position = 'absolute';
    temporaryInput.style.left = '-9999px';
    temporaryInput.style.top = '0';
    document.body.appendChild(temporaryInput);
    temporaryInput.value = text;

    temporaryInput.select();
    document.execCommand('copy');

    document.body.removeChild(temporaryInput);

    showCopiedTooltip(tooltipElement)

}


function showCopiedTooltip(tooltipElement) {
    const getHoveredElm = tooltipElement.querySelector('.tips');

    const translatedText = gettext('Control dates copied');
    const svgUrl = '../svg/check-circle.svg';

    // Update the tooltip text and add the class to show the tooltip
    getHoveredElm.classList.add('successful_copied');

    getHoveredElm.setAttribute('data-tooltip-after', `url(${svgUrl}) ' ${translatedText}'`);


    getHoveredElm.addEventListener('mouseleave', () => {

        setTimeout(() => {
            getHoveredElm.classList.remove('successful_copied');
            getHoveredElm.removeAttribute('data-tooltip-after');
        }, 500);
    });
}




