const App = {};

(() => {	

	App.initialize = (callback) => {
		callback();
	};

	/* --- Misc --- */
	App.disableLoginCheck = false;
	App.logout = () => { $.get('php/logout.php'); };

})();
