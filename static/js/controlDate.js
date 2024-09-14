// Function to handle date change and send data to the server
function calculateDaysLeft(surrogacyMotherId) {
    var controlDateElement = document.getElementById('control-date-' + surrogacyMotherId);
    var controlDate = controlDateElement.value;

    if (controlDate) {
        // Hide the input and replace it with loading text while fetching new data
        controlDateElement.style.display = 'none';

        var container = document.getElementById('control-date-container-' + surrogacyMotherId);
        container.style.cursor = 'wait'; // Change cursor to 'wait' to indicate processing

        var loadingSpan = document.createElement('span');
        loadingSpan.id = 'loading-' + surrogacyMotherId;
        loadingSpan.textContent = 'Loading...';
        container.appendChild(loadingSpan);

        // Perform AJAX request
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/admin/schedule/ukraine/calculate_control_date/?id=' + surrogacyMotherId + '&control_date=' + controlDate, true);
        xhr.responseType = 'json';

        xhr.onload = function() {
            container.style.cursor = 'default'; // Reset cursor to 'default' when loading is done
            if (xhr.status === 200) {
                if (xhr.response && xhr.response.days_left !== undefined) {
                    // Replace the input field with the data and make it clickable
                    container.innerHTML = '<span id="days-left-' + surrogacyMotherId +
                    '" class="clickable" style="cursor: pointer;">Days Left: ' + xhr.response.days_left + '</span>';

                    // Add click handler to show input again
                    document.getElementById('days-left-' + surrogacyMotherId).addEventListener('click', function() {
                        showInputField(surrogacyMotherId);
                    });
                } else {
                    console.error('Unexpected response format:', xhr.response);
                    container.innerHTML = '<span>Error calculating days left.</span>';
                }
            } else {
                console.error('Server returned status code:', xhr.status);
                container.innerHTML = '<span>Error calculating days left.</span>';
            }
        };

        xhr.onerror = function() {
            container.style.cursor = 'default'; // Reset cursor to 'default' in case of an error
            console.error('AJAX request failed');
            container.innerHTML = '<span>Error calculating days left.</span>';
        };

        xhr.send();
    } else {
        console.error('Control date not selected or invalid');
    }
}



// Function to show the input field again
function showInputField(surrogacyMotherId) {
    var container = document.getElementById('control-date-container-' + surrogacyMotherId);
    container.style.cursor = 'default'; // Reset cursor to 'default' when showing the input field
    container.innerHTML = '<input type="date" id="control-date-' + surrogacyMotherId + '" onchange="calculateDaysLeft(' + surrogacyMotherId + ')" style="cursor: pointer;">';
}

