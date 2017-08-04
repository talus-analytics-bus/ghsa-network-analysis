const App = {};

(() => {	

	App.initialize = (callback) => {
		callback();
	};

	/* --- Misc --- */
	App.disableLoginCheck = true;
	App.logout = () => { $.get('php/logout.php'); };

})();
