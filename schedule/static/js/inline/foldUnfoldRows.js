document.addEventListener('DOMContentLoaded', function() {
    // Get the fold/unfold button
    const foldButton = document.getElementById('fold-unfold-btn');

    // Get all inline rows with class .form-row.has_original
    const inlineRows = document.querySelectorAll('.form-row.has_original');

    let rowsToShow = []; // Array to store rows where disable is false

    // SVG for unfolded (minus/dash icon)
    const unfoldedSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
    </svg>`;

    // SVG for folded (plus icon)
    const foldedSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
    </svg>`;

    // Function to toggle the SVG in the button
    function toggleButtonIcon() {
        if (isFolded) {
            foldButton.innerHTML = foldedSVG;    // Show the plus icon when rows are folded
        } else {
            foldButton.innerHTML = unfoldedSVG;  // Show the dash icon when rows are unfolded
        }
    }

    // Initial setup: Show rows with disable=false, hide others
    inlineRows.forEach((row) => {
        const disableField = row.querySelector('input[name$="-disable"]');
        if (disableField && !disableField.checked) {
            row.style.display = '';  // Show rows where disable = false
            rowsToShow.push(row);    // Keep track of these rows
        } else {
            row.style.display = 'none';  // Hide rows where disable = true
        }
    });

    // Set the initial button icon
    let isFolded = true; // Start as folded (show plus icon)
    toggleButtonIcon();

    // Add toggle functionality to fold/unfold rows when the button is clicked
    foldButton.addEventListener('click', function() {
        if (isFolded) {
            // Unfold: Show all rows
            inlineRows.forEach(row => {
                row.style.display = '';  // Show all rows
            });
        } else {
            // Fold: Show only rows with disable = false
            inlineRows.forEach(row => {
                const disableField = row.querySelector('input[name$="-disable"]');
                if (disableField && !disableField.checked) {
                    row.style.display = '';  // Show rows where disable = false
                } else {
                    row.style.display = 'none';  // Hide rows where disable = true
                }
            });
        }
        isFolded = !isFolded; // Toggle the state between folded and unfolded
        toggleButtonIcon();   // Toggle the button icon
    });
});
