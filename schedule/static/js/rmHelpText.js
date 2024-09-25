document.addEventListener('DOMContentLoaded', function() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {

            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    const timezoneWarning = node.querySelector('.timezonewarning') || (node.classList && node.classList.contains('timezonewarning') ? node : null);
                    if (timezoneWarning) {
                        timezoneWarning.remove();
                    }
                }
            });
        });
    });


    observer.observe(document.body, { childList: true, subtree: true });
});
