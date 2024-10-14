// document.addEventListener('DOMContentLoaded', function () {
//     // Check if DateTimeShortcuts is loaded
//     if (typeof DateTimeShortcuts !== 'undefined') {
//         // Save the original handleCalendarCallback function
//         const originalHandleCalendarCallback = DateTimeShortcuts.handleCalendarCallback;
//
//         // Override the handleCalendarCallback function
//         DateTimeShortcuts.handleCalendarCallback = function (num) {
//             // Call the original function to keep default behavior
//             const originalCallback = originalHandleCalendarCallback(num)
//
//             // Return a new function that wraps the original behavior
//             return function (y, m, d) {
//
//                 // Call the original callback to handle the default behavior
//                 originalCallback(y, m, d)
//
//                 // Access the input field and log the new date value
//                 const inputField = DateTimeShortcuts.calendarInputs[num]
//                 if (inputField) {
//                     const selectedDate = inputField.value
//
//                     const surrogacyMotherId = inputField.getAttribute('data-mother-id')
//                     const surrogacyMotherCountry = inputField.getAttribute('data-mother-country')
//                     const country = inputField.getAttribute('data-country')
//
//                     // Check if this input field is inside a tooltip
//                     const tooltipElement = inputField.closest('.tooltip_element')
//
//                     // Call the function for tooltips
//                     calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, selectedDate,
//                         inputField, tooltipElement)
//                 }
//             };
//         };
//     }
// });

function initDateTimeShortcutsOverride(observer) {
    // Check if DateTimeShortcuts is available
    if (typeof DateTimeShortcuts !== 'undefined') {
        // Save the original handleCalendarCallback function
        const originalHandleCalendarCallback = DateTimeShortcuts.handleCalendarCallback;

        // Override the handleCalendarCallback function
        DateTimeShortcuts.handleCalendarCallback = function (num) {
            // Call the original function to maintain default behavior
            const originalCallback = originalHandleCalendarCallback(num);

            // Return a new function that wraps the original behavior
            return function (y, m, d) {
                // Execute original callback logic
                originalCallback(y, m, d);

                // Handle custom logic after date selection
                handleDateSelection(num);
            };
        };
    }
}

function handleDateSelection(num) {
    // Access the input field and log the new date value
    const inputField = DateTimeShortcuts.calendarInputs[num];
    if (inputField) {
        const selectedDate = inputField.value;
        const surrogacyMotherId = inputField.getAttribute('data-mother-id');
        const surrogacyMotherCountry = inputField.getAttribute('data-mother-country');
        const country = inputField.getAttribute('data-country');

        // Log or handle the selected date as needed
        console.log("Selected Date:", selectedDate);
        console.log("SurrogacyMotherId:", surrogacyMotherId);
        console.log("SurrogacyMotherCountry:", surrogacyMotherCountry);
        console.log("Country:", country);

        // Check if this input field is inside a tooltip
        const tooltipElement = inputField.closest('.tooltip_element');

        // Call a custom function for tooltips and calculate days left
        calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, selectedDate, inputField, tooltipElement);
    }
}


function calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, selectedDate, inputField,
                           toolTipElement = null) {

    if (selectedDate) {
        const divContainer = inputField.parentElement

        const url = getUrlBasedOnCountry(surrogacyMotherId, selectedDate, surrogacyMotherCountry, country);

        // Perform AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';

        xhr.onload = function () {
            if (xhr.status === 200 && xhr.response && xhr.response.days_left !== undefined) {
                const daysLeft = xhr.response.days_left;

                const spanElement = buildInputField(divContainer, surrogacyMotherId, country,
                    daysLeft, toolTipElement)

                setTimeout(() => {
                    spanElement.classList.add('fade-in');
                }, 15);

                spanElement.addEventListener('click', function () {
                    showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country, toolTipElement)
                });
            }
        };

        xhr.send();  // Send the AJAX request
    }
}


function buildInputField(divContainer, surrogacyMotherId, country, daysLeft, tooltipElement = null) {
    const newSpanElement = document.createElement('span')

    // Set id, text, and class based on whether it's a tooltip or not
    const isTooltip = !!tooltipElement
    newSpanElement.id = isTooltip
        ? `days-left-tooltip-${surrogacyMotherId}-${country}`
        : `days-left-${surrogacyMotherId}-${country}`

    newSpanElement.textContent = isTooltip
        ? `appeared days ${daysLeft}`
        : `still days ${daysLeft}`

    newSpanElement.className = isTooltip
        ? 'days_left_tooltip'
        : 'days_left'

    while (divContainer.firstChild) {
        divContainer.removeChild(divContainer.firstChild)
    }
    divContainer.appendChild(newSpanElement)
    return newSpanElement
}


function showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country, tooltipElement = null) {
    const isTooltip = !!tooltipElement
    let divContainer

    if (isTooltip) {
        const divContainerId = 'days-left-tooltip-' + surrogacyMotherId + '-' + country
        divContainer = document.getElementById(divContainerId).parentElement
    } else {
        divContainer = document.getElementById('control-date-container-' + surrogacyMotherId + '-' + country)
    }

    divContainer.innerHTML = ''

    const recreateField = document.createElement('input')
    recreateField.type = 'text'
    recreateField.id = `control-date-${surrogacyMotherId}-${country}`
    recreateField.setAttribute('data-mother-id', surrogacyMotherId)
    recreateField.setAttribute('data-mother-country', surrogacyMotherCountry)
    recreateField.setAttribute('data-country', country)
    recreateField.className = 'vDateField'

    divContainer.appendChild(recreateField)

    if (isTooltip) {
        initializeDjangoCalendarInTooltip(tooltipElement)
    } else {
        initializeDjangoCalendar(recreateField)
    }
}


function initializeDjangoCalendar(recreateField) {
    if (typeof DateTimeShortcuts !== 'undefined') {
        DateTimeShortcuts.addCalendar(recreateField);
    }
    cleanupDateShortcutsAndWarnings();
}

function initializeDjangoCalendarInTooltip(tooltipElement) {
    // Reinitialize the Django DateTimeShortcuts for the calendar inside the tooltip
    const dateField = tooltipElement.querySelector('.vDateField');
    if (typeof DateTimeShortcuts !== 'undefined') {
        DateTimeShortcuts.addCalendar(dateField)

        const calendarLink = tooltipElement.querySelector(`[id^="calendarlink"]`);

        if (calendarLink) {
            const linkId = calendarLink.id
            const linkNumber = linkId.match(/\d+$/)

            calendarLink.addEventListener('click', function () {
                const calendarBoxId = `calendarbox${linkNumber}`
                const calendarBox = document.getElementById(calendarBoxId)
                if (calendarBox) {
                    // Get the tooltip element's position and dimensions
                    const dateIcon = tooltipElement.querySelector('.date-icon')
                    const dateIconRect = dateIcon.getBoundingClientRect()

                    // Set the position of the calendar box based on the tooltip's position
                    calendarBox.style.left = `${dateIconRect.left}px`
                    calendarBox.style.top = `${dateIconRect.bottom}px`
                    calendarBox.style.zIndex = `1`
                }
            });
        }
        // clean the duplicates if exist
        cleanupDateShortcutsAndWarningsTooltip(tooltipElement)
    }
}

function getUrlBasedOnCountry(surrogacyMotherId, controlDate, surrogacyMotherCountry, country) {
    let url = ''

    if (surrogacyMotherCountry === 'MLD') {
        if (country === 'MLD') {
            url = '/admin/schedule/moldova/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        } else {
            url = '/admin/schedule/moldova/calculate_control_date_in_ukr/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        }
    } else if (surrogacyMotherCountry === 'UKR') {
        if (country === 'UKR') {
            url = '/admin/schedule/ukraine/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        } else {
            url = '/admin/schedule/ukraine/calculate_control_date_in_mld/?id=' + surrogacyMotherId + '&control_date=' + controlDate
        }
    } else {
        console.error('Unsupported surrogacyMotherCountry: ' + surrogacyMotherCountry)
    }

    return url
}