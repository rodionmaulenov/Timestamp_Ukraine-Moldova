document.addEventListener("DOMContentLoaded", function () {
    let scheduled = false;

    const observer = new MutationObserver(function (mutationsList) {
        if (!scheduled) {
            scheduled = true;
            requestAnimationFrame(() => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        cleanupRedundantLinkAndWarnings();
                        addListenersForClick();
                    }
                }
                scheduled = false; // reset after running
            });
        }
    });

    const targetNode = document.querySelector('.tabular');
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true }); // Observe the entire subtree
    }
});