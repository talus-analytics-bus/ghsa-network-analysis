const Routing = {};

(() => {
	// Precompiles all html handlebars templates on startup.
	// Compiling is front-loaded so the compiling does not happen on page changes.
	Routing.templates = {};
	Routing.precompileTemplates = () => {
		$("script[type='text/x-handlebars-template']").each((i, e) => {
			Routing.templates[e.id.replace('-template', '')] = Handlebars.compile($(e).html());
		});
	};

	Routing.initializeRoutes = () => {
		// setup crossroads for routing
		crossroads.addRoute('/', () => {
			loadPage('map', App.initMap);
		});
		crossroads.addRoute('/login', () => {
			loadTemplate('login');
			App.initLogin();
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/map', () => {
			loadPage('map', App.initMap);
		});

		// setup hasher for subscribing to hash changes and browser history
		hasher.prependHash = '';
		hasher.initialized.add(parseHash);
		hasher.changed.add(parseHash);
		hasher.init();
	};

	function loadPage(pageName, pageFunction, ...data) {
		$.noty.closeAll();
		if (App.disableLoginCheck) {
			loadPageLoggedIn(pageName, pageFunction, ...data);
		} else {
			$.get('php/login_check.php', (res) => {
				const loginData = $.parseJSON(res);
				if (loginData.error) {
					hasher.setHash('login');
					noty({ layout: 'center', type: 'warning', text: loginData.error });
				} else {
					loadPageLoggedIn(pageName, pageFunction, ...data);
				}
			});
		}
	}
	function loadPageLoggedIn(pageName, func, ...data) {
		loadTemplate(pageName);
		setNavigationBar(pageName, ...data);
		if (func) func(...data);
	}
	function setNavigationBar(pageName, ...data) {
		if (pageName === 'home') pageName = '';
		d3.selectAll('.navigation-link').classed('active', function() {
			return $(this).attr('page') === pageName;
		});
	}
	function parseHash(newHash) { crossroads.parse(newHash); }
	function loadTemplate(page, data) {
		$('#page-content').html(Routing.templates[page](data));
	}
})();
