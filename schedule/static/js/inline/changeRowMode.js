window.onload = function () {
    // Function to replace input fields with plain text and hide the original input and other elements
    function replaceWithTextAndHideField(field) {
        if (field && !field.classList.contains('processed')) {
            const value = field.value;  // Get the value of the input field

            // Create a new paragraph element and set the text content
            const textElement = document.createElement('p');
            textElement.textContent = value;
            textElement.classList.add('plain-text'); // Add a class for styling if needed

            // Get the parent <p> tag with class "date"
            const parentP = field.closest('p.date');
            if (parentP) {
                // Specifically hide <input> and <span> elements inside <p.date>
                const inputElement = parentP.querySelector('input');
                const spanElements = parentP.querySelectorAll('span');

                if (inputElement) inputElement.style.display = 'none'; // Hide the input
                spanElements.forEach(span => span.style.display = 'none'); // Hide each span element

                // Add the plain text element inside <p.date> if it's not already there
                if (!parentP.querySelector('.plain-text')) {
                    parentP.appendChild(textElement);
                }
            }
        }
    }

    // Function to replace select dropdown with plain text
    function replaceSelectWithTextAndHide(selectField) {
        if (selectField && !selectField.classList.contains('processed')) {
            const selectedText = selectField.options[selectField.selectedIndex].text;  // Get the selected text
            const textElement = document.createElement('p');  // Create a new paragraph element
            textElement.textContent = selectedText;  // Set the selected text as the content
            textElement.classList.add('plain-text'); // Add a class for styling if needed

            // Hide the dropdown but keep it in the DOM for form submission
            selectField.style.display = 'none';
            // Insert the plain text after the dropdown
            selectField.parentNode.insertBefore(textElement, selectField.nextSibling);

            // Mark this field as processed
            selectField.classList.add('processed');
        }
    }

    // Function to replace checkboxes with a checkmark or unchecked icon
    function replaceCheckboxWithTextAndHide(checkboxField) {
        if (checkboxField && !checkboxField.classList.contains('processed')) {
            const textElement = document.createElement('p');  // Create a new paragraph element
            if (checkboxField.checked) {
                textElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#216e39" class="bi bi-patch-check-fill" viewBox="0 0 16 16">
                  <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                </svg>`;
            } else {
                textElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#cf222e" class="bi bi-x-octagon-fill" viewBox="0 0 16 16">
                  <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353zm-6.106 4.5L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 1 1 .708-.708"/>
                </svg>`;
            }

            textElement.classList.add('plain-text'); // Add a class for styling if needed

            // Hide the checkbox but keep it in the DOM for form submission
            checkboxField.style.display = 'none';

            // Insert the plain text after the checkbox
            checkboxField.parentNode.insertBefore(textElement, checkboxField.nextSibling);

            // Mark this field as processed
            checkboxField.classList.add('processed');
        }
    }

    //Function to toggle the visibility of the form fields
    function toggleRowVisibility(row, button) {
        const entryField = row.querySelector('input[name$="-entry"]');
        const exitField = row.querySelector('input[name$="-exit"]');
        const countryField = row.querySelector('select[name$="-country"]');
        const disableCheckbox = row.querySelector('input[name$="-disable"]');

        // Plain text elements that were added to replace the original inputs
        const plainTextElements = row.querySelectorAll('.plain-text');

        // Check if form fields are currently hidden (i.e., plain text is visible)
        const isHidden = entryField && entryField.style.display === 'none';

        // Toggle visibility of form fields and plain text elements
        if (isHidden) {
            // Show the form fields (make them editable)
            plainTextElements.forEach(el => el.style.display = 'none'); // Hide plain text elements

            if (entryField) {
                const parentP = entryField.closest('p.date');
                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                entryField.style.display = '';  // Show the input field
                spanElements.forEach(span => span.style.display = '');  // Show the span elements
            }

            if (exitField) {
                const parentP = exitField.closest('p.date');
                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                exitField.style.display = '';  // Show the input field
                spanElements.forEach(span => span.style.display = '');  // Show the span elements
            }

            if (countryField) {
                countryField.style.display = '';  // Restore the select field
            }

            if (disableCheckbox) {
                disableCheckbox.style.display = '';  // Restore the checkbox
            }

            // Switch to the minus icon for hiding (editable state)
            setButtonIcon(button, 'minus');
        } else {
            // Hide the form fields and show the plain text (make them non-editable)
            plainTextElements.forEach(el => el.style.display = ''); // Show plain text elements

            if (entryField) {
                const parentP = entryField.closest('p.date');
                plainTextElements[0].textContent = entryField.value;

                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                entryField.style.display = 'none';  // Hide the input field
                spanElements.forEach(span => span.style.display = 'none');  // Hide the span elements
            }

            if (exitField) {
                const parentP = exitField.closest('p.date');
                plainTextElements[1].textContent = exitField.value;

                const spanElements = parentP.querySelectorAll('span');  // Find related span elements
                exitField.style.display = 'none';  // Hide the input field
                spanElements.forEach(span => span.style.display = 'none');  // Hide the span elements
            }

            if (disableCheckbox) {
                plainTextElements[2].innerHTML = disableCheckbox.checked ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#216e39" class="bi bi-patch-check-fill" viewBox="0 0 16 16">
                  <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                </svg>` : `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#cf222e" class="bi bi-x-octagon-fill" viewBox="0 0 16 16">
                  <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353zm-6.106 4.5L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 1 1 .708-.708"/>
                </svg>`;
                disableCheckbox.style.display = 'none';  // Hide the checkbox
            }

              if (countryField) {
                plainTextElements[3].textContent = countryField.options[countryField.selectedIndex].text;
                countryField.style.display = 'none';  // Hide the select field
            }

            // Switch to the plus icon for showing (non-editable state)
            setButtonIcon(button, 'plus');
        }
    }

    // Function to set the SVG icon (either pencil or minus)
    function setButtonIcon(button, type) {
        // Remove existing icon if any
        button.innerHTML = '';


        // Create the new SVG element
        const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgIcon.setAttribute("width", "16");
        svgIcon.setAttribute("height", "16");
        svgIcon.setAttribute("fill", "currentColor");

        if (type === 'minus') {
            svgIcon.setAttribute("class", "bi bi-dash-circle-dotted");
            svgIcon.setAttribute("viewBox", "0 0 16 16");

            // Create the path element for the dashed circle with minus
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z`);

            svgIcon.appendChild(path);

        } else {
            // Replacing plus with pencil icon
            svgIcon.setAttribute("class", "bi bi-pencil-square");
            svgIcon.setAttribute("viewBox", "0 0 16 16");

            const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path1.setAttribute("d", "M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z");

            const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path2.setAttribute("fill-rule", "evenodd");
            path2.setAttribute("d", "M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z");

            svgIcon.appendChild(path1);
            svgIcon.appendChild(path2);
        }

        // Append the SVG to the button
        button.appendChild(svgIcon);
    }


    // Function to add a "Revert" button to each row
    function addRevertButton(row) {
        let actionTd = row.querySelector('.action-td');

        if (!actionTd) {
            actionTd = document.createElement('td');
            actionTd.classList.add('action-td');

            const revertButton = document.createElement('button');
            revertButton.classList.add('revert-button');

            // Set initial icon to "plus" (form is initially non-editable)
            setButtonIcon(revertButton, 'plus');

            actionTd.appendChild(revertButton);
            row.appendChild(actionTd);

            // Add event listener to toggle the row's visibility and button icon
            revertButton.addEventListener('click', function (event) {
                event.preventDefault(); // Prevent form submission or navigation
                toggleRowVisibility(row, revertButton); // Toggle the visibility of the form fields
            });
        }
    }


    // Function to process each row in the table
    function processTableRows() {
        const tbody = document.querySelector('fieldset table tbody');

        if (tbody) {
            // Get all rows with the class 'form-row has_original'
            const rows = tbody.querySelectorAll('tr.form-row.has_original');
            rows.forEach((row) => {
                // Process each <td> within the row
                const entryField = row.querySelector('input[name$="-entry"]');
                const exitField = row.querySelector('input[name$="-exit"]');
                const countryField = row.querySelector('select[name$="-country"]');
                const disableCheckbox = row.querySelector('input[name$="-disable"]');

                replaceWithTextAndHideField(entryField);
                replaceWithTextAndHideField(exitField);
                replaceSelectWithTextAndHide(countryField);
                replaceCheckboxWithTextAndHide(disableCheckbox);

                // Add the "Revert" button at the end of the row
                addRevertButton(row);

            });
        }
    }

    // Use MutationObserver to monitor added rows and re-process all rows
    function monitorRowChanges() {
        const tbody = document.querySelector('fieldset table tbody');

        if (tbody) {
            const observer = new MutationObserver(() => {
                processTableRows(); // Re-process all rows when new row is added
            });

            // Start observing tbody for child nodes being added
            observer.observe(tbody, {childList: true});
        }
    }

    // Initial processing of all rows
    processTableRows();

    // Monitor the row changes and re-process when a new row is added
    monitorRowChanges();
};


