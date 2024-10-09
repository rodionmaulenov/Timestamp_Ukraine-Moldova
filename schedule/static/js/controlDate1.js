// Generalized function to show the input field and reinitialize the jQuery datepicker
function showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country, tooltipElement = null, isTooltip = false) {
    const divContainerId = isTooltip
        ? 'days-left-tooltip-' + surrogacyMotherId + '-' + country
        : 'control-date-container-' + surrogacyMotherId + '-' + country;

    // Get the parent container for tooltips or directly the container for normal input
    const divContainer = isTooltip
        ? document.getElementById(divContainerId).parentElement
        : document.getElementById(divContainerId);

    divContainer.innerHTML = '';  // Clear the container to remove existing content

    const recreateField = document.createElement('input');
    recreateField.type = 'text';
    recreateField.id = `control-date-${surrogacyMotherId}-${country}`;
    recreateField.className = 'datepicker-here choose-date-input';
    recreateField.placeholder = 'choose date';
    recreateField.setAttribute('data-mother-id', surrogacyMotherId);
    recreateField.setAttribute('data-mother-country', surrogacyMotherCountry);
    recreateField.setAttribute('data-country', country);

    divContainer.appendChild(recreateField);

    if (isTooltip) {
        // Initialize with tooltipElement for tooltips
        initializeDatePicker(recreateField, tooltipElement);
    } else {
        // Initialize without tooltipElement for normal input
        $(recreateField).datepicker({
            dateFormat: 'yyyy-mm-dd',
            onSelect: function (formattedDate, date, inst) {
                handleDateSelect(formattedDate, date, inst);
            }
        });
    }
}


// Function to build URL
function getUrlBasedOnCountry(surrogacyMotherId, controlDate, surrogacyMotherCountry, country) {
    let url = '';

    if (surrogacyMotherCountry === 'MLD') {
        if (country === 'MLD') {
            url = '/admin/schedule/moldova/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate;
        } else {
            url = '/admin/schedule/moldova/calculate_control_date_in_ukr/?id=' + surrogacyMotherId + '&control_date=' + controlDate;
        }
    } else if (surrogacyMotherCountry === 'UKR') {
        if (country === 'UKR') {
            url = '/admin/schedule/ukraine/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate;
        } else {
            url = '/admin/schedule/ukraine/calculate_control_date_in_mld/?id=' + surrogacyMotherId + '&control_date=' + controlDate;
        }
    } else {
        console.error('Unsupported surrogacyMotherCountry: ' + surrogacyMotherCountry);
    }

    return url;
}


function calculateDaysLeft(surrogacyMotherId, surrogacyMotherCountry, country, selectedDate) {

    const inputFieldId = 'control-date-' + surrogacyMotherId + '-' + country;
    const inputField = document.getElementById(inputFieldId);

    const controlDate = selectedDate

    if (controlDate) {
        inputField.style.display = 'none';

        let divContainer;


        const divContainerId = 'control-date-container-' + surrogacyMotherId + '-' + country;
        divContainer = document.getElementById(divContainerId);

        const url = getUrlBasedOnCountry(surrogacyMotherId, controlDate, surrogacyMotherCountry, country);

        // Perform AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';

        xhr.onload = function () {
            // Remove the loading span once the response is received
            const existingLoadingSpan = document.getElementById(`loading-${surrogacyMotherId}`);
            if (existingLoadingSpan) {
                existingLoadingSpan.remove();  // Remove the loading text
            }

            if (xhr.status === 200 && xhr.response && xhr.response.days_left !== undefined) {
                const daysLeft = xhr.response.days_left;
                const daysLeftSpan = document.createElement('span');
                daysLeftSpan.id = `days-left-${surrogacyMotherId}-${country}`;
                daysLeftSpan.textContent = 'appeared days' + ` ${daysLeft}`;
                daysLeftSpan.className = 'days_left';

                divContainer.removeChild(inputField);
                divContainer.appendChild(daysLeftSpan);

                setTimeout(() => {
                    daysLeftSpan.classList.add('fade-in');
                }, 10);

                daysLeftSpan.addEventListener('click', function () {
                    showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country);
                });

            }
        };

        xhr.send();  // Send the AJAX request
    }
}


function calculateDaysLeftToolTip(surrogacyMotherId, surrogacyMotherCountry,
                                  country, controlDate = null, tooltipElement = null) {
    // Get the input field inside the tooltip element
    const inputField = tooltipElement.querySelector(
        `input[data-mother-id='${surrogacyMotherId}'][data-country='${country}']`
    );

    if (controlDate) {
        // Hide the input and replace it with loading text while fetching new data
        inputField.style.display = 'none';

        // Get the parent container (div) of the input field
        const divContainer = inputField.parentElement;

        // Send AJAX request to get days_left data
        const url = getUrlBasedOnCountry(surrogacyMotherId, controlDate, surrogacyMotherCountry, country);
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';

        xhr.onload = function () {

            if (xhr.status === 200 && xhr.response && xhr.response.days_left !== undefined) {
                const daysLeft = xhr.response.days_left;

                if (inputField) {
                    // Create a new span element for displaying the days left
                    const daysLeftSpan = document.createElement('span');
                    daysLeftSpan.id = `days-left-tooltip-${surrogacyMotherId}-${country}`;
                    daysLeftSpan.textContent = 'appeared days' + ` ${daysLeft}`;
                    daysLeftSpan.className = 'days_left_tooltip';

                    // Remove the input field and append the days left span
                    divContainer.removeChild(inputField);
                    divContainer.appendChild(daysLeftSpan);

                    setTimeout(() => {
                        daysLeftSpan.classList.add('fade-in');
                    }, 15);
                    // Make the span clickable to show the input field again
                    daysLeftSpan.addEventListener('click', function () {
                        console.log(tooltipElement)
                        showInputFieldGeneric(surrogacyMotherId, surrogacyMotherCountry, country, tooltipElement, true);
                    });
                }
            } else {
                // Handle any errors if needed
                console.error("Error fetching the days left data.");
            }
        };

        xhr.onerror = function () {
            // Handle any errors if the request fails
            clearInterval(dotInterval);
            console.error("AJAX request failed.");
        };

        xhr.send();  // Send the AJAX request
    }
}
