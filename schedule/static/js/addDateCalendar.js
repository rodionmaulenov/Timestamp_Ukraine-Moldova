document.addEventListener("DOMContentLoaded", function () {
    observeForChanges()
});

function observeForChanges() {
    // Create a MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(function (mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                addDatetimeShortcut()
            }
        }
    })

    // Start observing the target node for changes (the result_list table in this case)
    const targetNode = document.querySelector('#result_list')
    if (targetNode) {
        observer.observe(targetNode, {childList: true, subtree: true}) // Observe the entire subtree
    }
}

function addDatetimeShortcut() {
    const allCustomCalendar = document.querySelectorAll("#result_list .custom_calendar")

        allCustomCalendar.forEach(function (dateShortcuts, index) {
        // Create the new <span> element
        const span = document.createElement('span');
        span.className = 'datetimeshortcuts';

        const anchor = document.createElement('a');
        anchor.href = '#';
        anchor.id = `calendarlink${index}`;

        const icon = document.createElement('span');
        icon.className = 'date-icon';
        icon.title = 'Choose a Date';

        // Append the icon to the anchor
        anchor.appendChild(icon);
        // Append the anchor to the span
        span.appendChild(anchor);

        // Insert the <span> after the input field inside the custom_calendar div
        const inputField = dateShortcuts.querySelector('input');
        if (inputField) {
            inputField.after(span);
        }

        // Clean up unwanted child nodes
        const nodes = Array.from(dateShortcuts.childNodes);
        nodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE && !(node.id && node.id.startsWith('calendarlink'))) {
                node.remove();
            } else if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
            }
        });
    });
}