	const menuButton = document.querySelector('.menu-toggle');
	const navigation = document.querySelector('.nav-links');

	function closeNavigation(returnFocus = false) {
		navigation.classList.remove('open');
		menuButton.setAttribute('aria-expanded', 'false');
		menuButton.setAttribute('aria-label', 'Open navigation');
		menuButton.textContent = '☰';

		if (returnFocus) {
			menuButton.focus();
		}
	}

	menuButton.addEventListener('click', () => {
		const isOpen = navigation.classList.toggle('open');
		menuButton.setAttribute('aria-expanded', String(isOpen));
		menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
		menuButton.textContent = isOpen ? '×' : '☰';
	});
	navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeNavigation()));

	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && navigation.classList.contains('open')) {
			closeNavigation(true);
		}
	});

	document.addEventListener('click', event => {
		if (
			navigation.classList.contains('open') &&
			!navigation.contains(event.target) &&
			!menuButton.contains(event.target)
		) {
			closeNavigation();
		}
	});

	const contactForm = document.getElementById('contact-form');
	const formStatus = document.getElementById('form-status');
	document.getElementById('year').textContent = new Date().getFullYear();
	contactForm.addEventListener('submit', event => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const subject = encodeURIComponent(`Project enquiry from ${data.get('name')}`);
		const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\n\n${data.get('message')}`);
		formStatus.textContent = 'Opening your email app. Review and send the enquiry there.';
		window.location.href = `mailto:teakflooringinteriors@gmail.com?subject=${subject}&body=${body}`;
	});
