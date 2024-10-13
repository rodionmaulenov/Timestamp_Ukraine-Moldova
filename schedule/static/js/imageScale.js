document.addEventListener('DOMContentLoaded', function () {
    const viewPhotoLinks = document.querySelectorAll('.view-photo-link');

    viewPhotoLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const image = this.nextElementSibling;
            const imageParent = image.parentElement;
            const imageParentRect = imageParent.getBoundingClientRect();

            // Toggle display of the image
            if (image.style.display === 'block') {
                // If the image is already visible, hide it
                image.style.display = 'none';
                image.classList.remove('clicked-image');
            } else {
                // If the image is hidden, show it
                image.style.display = 'block';
                if (window.innerWidth > 768) {
                    image.style.left = `${imageParentRect.left}px`;
                    image.style.top = `${imageParentRect.bottom}px`;
                }
                image.classList.add('clicked-image');

                // Add click event to the image to hide it when clicked
                image.addEventListener('click', function () {
                    image.style.display = 'none';
                    image.classList.remove('clicked-image');
                }, { once: true });

                // Add click event on the document to hide the image if clicked outside
                document.addEventListener('click', function hideImageOnOutsideClick(event) {
                    if (!image.contains(event.target) && !link.contains(event.target)) {
                        image.style.display = 'none';
                        image.classList.remove('clicked-image');
                        document.removeEventListener('click', hideImageOnOutsideClick); // Remove event listener once the image is hidden
                    }
                });
            }
        });
    });
});
