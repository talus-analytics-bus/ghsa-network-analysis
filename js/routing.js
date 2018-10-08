const Routing = {};

(() => {
	const templates = {};
	const partials = {};

	const hbTemplates = [
		'home',
		'about',
		'analysis-country',
		'analysis-pair',
		'analysis-table',
		'analysis',
		'glossary',
		'landing',
		'map',
		'settings',
		'submit',
	]; // Add the name of the new template here
	const hbPartials = []; // Add name of new partial here
	const hbDirectory = 'templates/'; // Don't touch
	const hbFileSuffix = '.hbs'; // Don't touch


	//
	// Logic: 	1) Load the handlebar templates from disk
	//			2) Precompile the templates
	//			3) Initialize the routes
	//		Now the handlebar templates / partials are able to be used.
	//
	//
	// The template compilation will happen once all of the handlebar templates are loaded into body.
	//
	Routing.prepareHandlebarPartials = (callback) => {

		if (hbPartials.length === 0) {
			if (callback) {
				callback()
			} else {
				return;
			}
		}

		let hbCount = 0; // This is the counter.
		hbPartials.forEach((d) => {
			$.ajax({
				url: `${hbDirectory}${d}-partial${hbFileSuffix}`,
				cache: true,
				success: function (data, status, error) {
					source = data;
					$('body').append(data);
					hbCount++;
					if (hbCount === hbPartials.length) Routing.registerPartials(callback);
				},
				error: function (data, status, error) {

					// ToDo write the error handler details here
				},
			});
		});
	};

	Routing.prepareHandlebarTemplates = (callback) => {
		let count = 0; // This is the counter.
		hbTemplates.forEach((d) => {
			$.ajax({
				url: `${hbDirectory}${d}-template${hbFileSuffix}`,
				cache: true,
				success: function (data, status, error) {
					source = data;
					$('body').append(data);
					count++;
					if (count === hbTemplates.length) Routing.precompileTemplates(callback);
				},
				error: function (data, status, error) {
					// ToDo write the error handler details here
				},
			});
		});
	};

	Routing.prepareHandlebar = () => {
		Routing.prepareHandlebarPartials(() => {
			Routing.prepareHandlebarTemplates(() => {
				Routing.initializeRoutes();
			});
		});
	};

	Routing.precompileTemplates = (callback) => {
		$("script[type='text/x-handlebars-template']").each((i, e) => {
			templates[e.id.replace('-template', '')] = Handlebars.compile($(e).html());
		});

		if (callback) {
			callback();
		}
	};

	Routing.registerPartials = (callback) => {
		$("script[type='text/x-handlebars-partial']").each((i, e) => {
			const name = e.id.replace('-template', '');
			partials[name] = Handlebars.registerPartial(name, $(e).html());
		});

		if (callback) {
			callback();
		}
	};

	crossroads.ignoreState = true;
	Routing.initializeRoutes = () => {
		// setup crossroads for routing
		crossroads.addRoute('/map', () => {
			loadPage('map', App.initMap);
		});
		// crossroads.addRoute('/', () => {
		// 	loadPage('landing', App.initLanding, 'country');
		// });
		crossroads.addRoute('/', () => {
			loadPage('home', App.initHome);
		});
		crossroads.addRoute('/analysis', () => {
			loadPage('analysis', App.initAnalysis, 'network');
		});
		crossroads.addRoute('/analysis/country', () => {
			loadPage('analysis', App.initAnalysis, 'country');
		});
		crossroads.addRoute('/analysis/{iso}', (iso) => {
			loadPage('analysis-country', App.initAnalysisCountry, iso);
		});
		crossroads.addRoute('/analysis/{iso}/d', (iso) => {
			loadPage('analysis-country', App.initAnalysisCountry, iso, 'd');
		});
		crossroads.addRoute('/analysis/{iso}/r', (iso) => {
			if (iso !== 'ghsa') {
				loadPage('analysis-country', App.initAnalysisCountry, iso, 'r');
			} else {
				hasher.setHash('analysis/ghsa/d');
			}
		});
		crossroads.addRoute('/analysis/{iso}/{type}/table', (iso, type) => {
			loadPage('analysis-table', App.initAnalysisTable, iso, type);
		});
		crossroads.addRoute('/analysis/{fundIso}/{recIso}', (fundIso, recIso) => {
			loadPage('analysis-pair', App.initAnalysisPair, fundIso, recIso);
		});
		crossroads.addRoute('/submit', () => {
			loadPage('submit', App.initSubmit);
		});
		crossroads.addRoute('/glossary', () => {
			loadPage('glossary');
		});
		crossroads.addRoute('/settings', () => {
			loadPage('settings', App.initSettings);
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
		let navName = pageName;
		// let navName = pageName.split('-')[0];
		if (pageName === "landing") navName = "";
		// set nav
		$('a.active').removeClass('active');
		$(`a[page="${navName}"]`).addClass('active');

		// load page
		$('body').removeClass('dark');
		loadTemplate(pageName);
		if (func) func(...data);
		window.scrollTo(0, 0);
	}
	function parseHash(newHash) { crossroads.parse(newHash); }
	function loadTemplate(page, data) {
		$('#page-content').html(templates[page](data));
	}
})();
