const Routing = {};

(() => {
	// Precompiles all html handlebars templates on startup.
	// Compiling is front-loaded so the compiling does not happen on page changes.
	const templates = {};
	Routing.precompileTemplates = () => {
		$("script[type='text/x-handlebars-template']").each((i, e) => {
			templates[e.id.replace('-template', '')] = Handlebars.compile($(e).html());
		});
	};

	Routing.initializeRoutes = () => {
		// setup crossroads for routing
		crossroads.addRoute('/', () => {
			loadPage('home', App.initHome);
		});
		crossroads.addRoute('/analysis', () => {
			loadPage('analysis', App.initAnalysis);
		});
		crossroads.addRoute('/analysis/{iso}', (iso) => {
			loadPage('analysis', App.initAnalysis, iso);
		});
		crossroads.addRoute('/submit', () => {
			loadPage('submit', App.initSubmit);
		});
		crossroads.addRoute('/about', () => {
			loadPage('about');
		});

		// setup hasher for subscribing to hash changes and browser history
		hasher.prependHash = '';
		hasher.initialized.add(parseHash);
		hasher.changed.add(parseHash);
		hasher.init();
	};

	function loadPage(pageName, func, ...data) {
		loadTemplate(pageName);
		if (func) func(...data);
		window.scrollTo(0, 0);
	}
	function parseHash(newHash) { crossroads.parse(newHash); }
	function loadTemplate(page, data) {
		$('#page-content').html(templates[page](data));
	}
})();
