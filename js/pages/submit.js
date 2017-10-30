(() => {
	App.initSubmit = () => {
		// connect link to glossary page
		$('.glossary-button').click(() => hasher.setHash('glossary'));

		// clicking "upload" button opens file selection window
		$('.btn-report-upload').click(() => {
			$('.input-report-upload').trigger('click');
		});

		// update file name text when user selects a file to be uploaded
		$('.input-report-upload').on('change', function updateText() {
			let fileName = 'No file selected';
			if (this.files.length) fileName = this.files[0].name;
			$('.file-name-text').text(fileName);
		});

		// upload completed project report
		$('.submit-button').click(() => {
			// check that contact fields are filled out
			const firstName = $('.first-name-input').val();
			const lastName = $('.last-name-input').val();
			const org = $('.org-input').val();
			const email = $('.email-input').val();
			if (!firstName) {
				noty({ text: '<b>Please enter a first name before proceeding.</b>' });
				return;
			}
			if (!lastName) {
				noty({ text: '<b>Please enter a last name before proceeding.</b>' });
				return;
			}
			if (!org) {
				noty({ text: '<b>Please enter an organization before proceeding.</b>' });
				return;
			}
			if (!email) {
				noty({ text: '<b>Please enter an email address before proceeding.</b>' });
				return;
			}
			if (!/\S+@\S+/.test(email)) {
				noty({ text: '<b>Please enter a valid email address before proceeding.</b>' });
				return;
			}

			const input = d3.select('.input-report-upload').node();
			if ('files' in input) {
				// check that file was uploaded
				if (!input.files.length) {
					noty({ text: '<b>Please select a file before proceeding!</b>' });
					return;
				}

				const file = input.files[0];

				// check that file is in xls or xlsx format
				const fileNameArr = file.name.split('.');
				const fileType = fileNameArr[fileNameArr.length - 1];
				if (fileType !== 'xlsx' && fileType !== 'xls') {
					noty({
						timeout: 5000,
						text: '<b>Please select a file with a file type ' +
							'extension of <i>.xls</i> or <i>.xlsx</i>',
					});
					return;
				}

				// check that file size is under ~100 MB
				if (file.size > 100e6) {
					noty({
						timeout: 5000,
						text: '<b>The file selected is too large to be uploaded!</b><br>' +
							'Please select a file under 100 MB.',
					});
					return;
				}

				submitProjectReport(file);
			}
		});
	};

	// parses project report and saves data
	function submitProjectReport(file) {
		NProgress.start();

		// create form
		const formData = new FormData();
		formData.append('firstname', $('.first-name-input').val());
		formData.append('lastname', $('.last-name-input').val());
		formData.append('org', $('.org-input').val());
		formData.append('email', $('.email-input').val());
		formData.append('upload', file, file.name);

		// send HTTP request
		$.ajax({
			url: '/upload-s3',
			method: 'POST',
			data: formData,
			processData: false,
			contentType: false,
		})
			.done((data, status) => {
				console.log(data);

				// clear out input
				$('.input-report-upload').val('');
				$('.file-name-text').text('No file selected');

				// show success notification
				noty({ type: 'success', text: '<b>Success!</b><br>Report has been submitted!' });
				NProgress.done();
			})
			.fail((data, status) => {
				console.log(data.responseJSON.error);
				noty({ text: '<b>Error!</b><br>There was an issue submitting your report. Please notify the administrators of the tool.' });
				NProgress.done();
			});
	}
})();
