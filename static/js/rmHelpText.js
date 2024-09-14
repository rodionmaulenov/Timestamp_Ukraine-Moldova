document.addEventListener('DOMContentLoaded', function() {
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Check if the added nodes contain the warning element
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Ensure it's an element node
                    var timezoneWarning = node.querySelector('.timezonewarning') || (node.classList && node.classList.contains('timezonewarning') ? node : null);
                    if (timezoneWarning) {
                        timezoneWarning.remove();
                    }
                }
            });
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
});
