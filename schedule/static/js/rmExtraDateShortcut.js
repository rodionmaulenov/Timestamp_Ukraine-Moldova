document.addEventListener("DOMContentLoaded", function () {
    const observer = new MutationObserver(function (mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                cleanupRedundantLinkAndWarnings()
                addListenersForClick()
            }
        }
    });

    const targetNode = document.querySelector('#result_list')
    if (targetNode) {
        observer.observe(targetNode, {childList: true, subtree: true}) // Observe the entire subtree
    }
});



function cleanupRedundantLinkAndWarnings() {

    const tableDateShortcuts = document.querySelectorAll("#result_list .datetimeshortcuts")

    tableDateShortcuts.forEach(function (dateShortcuts) {
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


function addListenersForClick() {
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


let activeCalendar = null;

function toggleCalendar(calendarBoxId) {
    // Find the current calendar box using the ID
    const calendarBox = document.getElementById(calendarBoxId);
    // Close the currently active calendar if it's different from the one being opened
    if (activeCalendar && activeCalendar !== calendarBox) {
        activeCalendar.style.display = 'none';
        activeCalendar = null;
    }
    calendarBox.style.display = 'block';
    activeCalendar = calendarBox;

}

document.addEventListener('DOMContentLoaded', function () {
    // Check if DateTimeShortcuts is loaded
    if (typeof DateTimeShortcuts !== 'undefined') {
        // Save the original handleCalendarCallback function
        const originalHandleCalendarCallback = DateTimeShortcuts.handleCalendarCallback;

        // Override the handleCalendarCallback function
        DateTimeShortcuts.handleCalendarCallback = function (num) {
            // Call the original function to keep default behavior
            const originalCallback = originalHandleCalendarCallback(num)

            // Return a new function that wraps the original behavior
            return function (y, m, d) {

                // Call the original callback to handle the default behavior
                originalCallback(y, m, d)

                // Access the input field and log the new date value
                const inputField = DateTimeShortcuts.calendarInputs[num]
                if (inputField) {
                    const selectedDate = inputField.value
                    const parentDivContainer = inputField.closest('.custom_calendar')
                    const surrogacyMotherId = parentDivContainer.getAttribute('data-mother-id')
                    const surrogacyMotherCountry = parentDivContainer.getAttribute('data-mother-country')
                    const country = parentDivContainer.getAttribute('data-country')

                    // Check if this input field is inside a tooltip
                    const tooltipElement = inputField.closest('.tooltip_element')

                    // Call the function for tooltips
                    calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, selectedDate,
                        inputField, tooltipElement)
                }
            };
        };
    }
});


