document.addEventListener("DOMContentLoaded", function () {
    observeForChanges()
});

function observeForChanges() {
    // Create a MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(function(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                cleanupDateShortcutsAndWarnings()
                initDateTimeShortcutsOverride()
                initializeCalendarListeners()
            }
        }
    })

    // Start observing the target node for changes (the result_list table in this case)
    const targetNode = document.querySelector('#result_list')
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true }) // Observe the entire subtree
    }
}

function cleanupDateShortcutsAndWarnings() {
    const allDateShortcuts = document.querySelectorAll("#result_list .datetimeshortcuts")

    allDateShortcuts.forEach(function (dateShortcuts) {
        const nodes = Array.from(dateShortcuts.childNodes)

        nodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE && !(node.id && node.id.startsWith('calendarlink'))) {
                node.remove();
            } else if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
            }
        });
    });

    const allTimezoneWarnings = document.querySelectorAll('.help.timezonewarning')
    allTimezoneWarnings.forEach(function (timezoneWarningDiv) {
        timezoneWarningDiv.remove()
    });
}

function cleanupDateShortcutsAndWarningsTooltip(toolTip = null) {

    if (toolTip) {
        const container = toolTip.querySelector('[id*="control-date-container"]')

        if (container) {
            const dateShortcuts = container.querySelectorAll('.datetimeshortcuts')

            if (dateShortcuts.length > 1) {
                dateShortcuts[1].remove()
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
    }
}

let activeCalendar = null;

function initializeCalendarListeners() {
    // Add event listeners for calendar links
    const calendarLinks = document.querySelectorAll('[id^="calendarlink"]');
    calendarLinks.forEach(function (calendarLink) {
        calendarLink.removeEventListener('click', handleCalendarClick); // Ensure no duplicate listeners
        calendarLink.addEventListener('click', handleCalendarClick);
    });
}


function handleCalendarClick(event) {
    event.preventDefault();

    const calendarLink = event.currentTarget;
    const linkId = calendarLink.id;
    const linkNumber = linkId.match(/\d+$/)[0];

    const calendarBoxId = `calendarbox${linkNumber}`;

    toggleCalendar(calendarBoxId);
}

function toggleCalendar(calendarBoxId) {
    // Find the current calendar box using the ID
    const calendarBox = document.getElementById(calendarBoxId);
    // Close the currently active calendar if it's different from the one being opened
    if (activeCalendar && activeCalendar !== calendarBox) {
        activeCalendar.style.display = 'none';
        activeCalendar = null;
    }
    calendarBox.style.display = 'block';
    console.log(calendarBox)
    activeCalendar = calendarBox;

}






