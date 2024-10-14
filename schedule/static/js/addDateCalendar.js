document.addEventListener("DOMContentLoaded", function () {
    observeForChanges();
});

function observeForChanges() {
    // Create a MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(function (mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // Temporarily disconnect observer to prevent infinite loop
                observer.disconnect();
                addDatetimeShortcut(observer);  // Pass the observer to reconnect later
                observer.observe(targetNode, { childList: true, subtree: true });
            }
        }
    });

    // Start observing the target node for changes (the result_list table in this case)
    const targetNode = document.querySelector('#result_list');
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true }); // Observe the entire subtree
    }
}

function addDatetimeShortcut(observer) {
    const allCustomCalendar = document.querySelectorAll("#result_list .custom_calendar");

    allCustomCalendar.forEach(function (dateShortcuts, index) {
        // Check if the calendarlink already exists to prevent duplicates
        if (!dateShortcuts.querySelector(`#calendarlink${index}`)) {
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
        }
    });
}
