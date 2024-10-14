let activeTooltip = null
let activeElement = null

function toggleTooltip(surrogacyName, event, element) {
    event.preventDefault()

    // When clicking the link `Info`, find the `tooltip_element`
    const originalTooltipElement = element.closest('.tooltip_link').nextElementSibling

    if (activeTooltip && activeElement === element) {
        closeTooltip()
        return;
    }

    if (activeTooltip) {
        closeTooltip()
        return;
    }

    // Clone the tooltip and append it to the body
    const tooltipElement = originalTooltipElement.cloneNode(true)
    tooltipElement.classList.add('active')
    tooltipElement.style.position = 'absolute'
    document.body.appendChild(tooltipElement)

    // Get the position of the tooltip relative to the clicked link
    const rect = element.getBoundingClientRect()
    tooltipElement.style.left = `${rect.left + window.scrollX}px`
    tooltipElement.style.top = `${rect.bottom + window.scrollY}px`

    // Set this tooltip as the active tooltip
    activeTooltip = tooltipElement
    activeElement = element

    initializeDjangoCalendarInTooltip(tooltipElement)
    cleanupDateShortcutsAndWarningsTooltip(tooltipElement)
    tipBefore(tooltipElement)
    svgEffectsWhenClicking(tooltipElement)

    const spanForCopyingText = tooltipElement.querySelector('.copy-deadline')
    spanForCopyingText.addEventListener('click', function () {
        getTooltipDataExcludingHeader(surrogacyName, tooltipElement)
    });

    // Prevent the tooltip from closing when clicking inside the tooltip itself
    tooltipElement.addEventListener('click', function (e) {
        e.stopPropagation()
    });
    // Add the outside click listener to close the tooltip
    document.addEventListener('click', handleOutsideClick)
}


function handleOutsideClick(e) {

    if (activeTooltip &&
        !activeTooltip.contains(e.target) &&
        !activeElement.contains(e.target)) {
        closeTooltip()
    }
}


function closeTooltip() {
    if (activeTooltip) {
        activeTooltip.classList.remove('active')
        if (document.body.contains(activeTooltip)) {
            document.body.removeChild(activeTooltip)
        }
        activeTooltip = null;
        activeElement = null;

        // Remove the outside click event listener
        document.removeEventListener('click', handleOutsideClick);
    }
}


function cleanupDateShortcutsAndWarningsTooltip(toolTip) {

    const container = toolTip.querySelector('.custom_calendar')
    if (container) {
        const dateShortcuts = container.querySelectorAll('.datetimeshortcuts');
        if (dateShortcuts.length > 1) {dateShortcuts[1].remove();

        }
    }
    const dateShortcut = container.querySelector(".datetimeshortcuts")
    if (dateShortcut) {
        const nodes = Array.from(dateShortcut.childNodes)

        nodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE && !(node.id && node.id.startsWith('calendarlink'))) {
                node.remove()
            } else if (node.nodeType === Node.TEXT_NODE) {
                node.remove()
            }
        });
    }

}











