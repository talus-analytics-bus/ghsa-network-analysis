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

	crossroads.ignoreState = true;
	Routing.initializeRoutes = () => {

		// setup crossroads for routing
		crossroads.addRoute('/:?{query}:', (query) => {
			loadPage('home', App.initHome, query);
		});
		crossroads.addRoute('/analysis:?{query}:', (query) => {
			loadPage('analysis', App.initAnalysis, 'network', query);
		});
		crossroads.addRoute('/analysis/country:?{query}:', (query) => {
			loadPage('analysis', App.initAnalysis, 'country', query);
		});
		// crossroads.addRoute('/analysis/{iso}:?{query}:', (iso, query) => {
		// 	loadPage('analysis-country', App.initAnalysisCountry, iso, 'd');
		// });
		crossroads.addRoute('/analysis/{iso}/d:?{query}:', (iso, query) => {
			loadPage('analysis-country', App.initAnalysisCountry, iso, 'd');
		});
		crossroads.addRoute('/analysis/{iso}/r:?{query}:', (iso, query) => {
			loadPage('analysis-country', App.initAnalysisCountry, iso, 'r');
		});
		crossroads.addRoute('/analysis/{iso}/{type}/table:?{query}:', (iso, type, query) => {
			loadPage('analysis-table', App.initAnalysisTable, iso, type);
		});
		crossroads.addRoute('/analysis/{fundIso}/{recIso}:?{query}:', (fundIso, recIso, query) => {
			loadPage('analysis-pair', App.initAnalysisPair, fundIso, recIso);
		});
		crossroads.addRoute('/submit:?{query}:', () => {
			loadPage('submit', App.initSubmit);
		});
		crossroads.addRoute('/glossary:?{query}:', () => {
			loadPage('glossary');
		});
		crossroads.addRoute('/settings:?{query}:', () => {
			loadPage('settings', App.initSettings);
		});
		crossroads.addRoute('/about:?{query}:', () => {
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
