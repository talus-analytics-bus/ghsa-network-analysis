(() => {
	/*
	*	Initializes the login page
	*/
	App.initLogin = () => {
		
		$('.login-button').click(login);
		$('.password-input').on('keyup', (e) => {
			if (e.which === 13) login();
		});
	};
	
	function login() {
		NProgress.start();
		$.noty.closeAll();
		const username = $('.username-input').val();
		const password = $('.password-input').val();
		$.get('php/login.php', {
			username,
			password,
		}, (data) => {
			const response = $.parseJSON(data);						
			if (response.error) noty({layout: 'top', type: 'warning', text: '<b>Error!</b><br>' + response.error});
			else hasher.setHash('');
			NProgress.done();
		});
	};
})();
